import { assert } from 'chai';
import 'mocha';

import { AttributeInfo } from '../../src/attributes';
import { Cart } from '../../src/cart';
import {
    Edit,
    EditOp,
    LogicalCart,
    LogicalItem,
    SimpleRepairs,
} from '../../src/test_suite2';
import { IDGenerator } from '../../src/utilities';

import {
    mediumChocolateCone,
    mediumDecafCoffee,
    noWhippedCream,
    smallCoffee,
    smallDecafCoffee,
    smallWorldAttributes,
    smallWorldCatalog,
    smallIcedDecafCoffee,
    soyMilk,
    twoMilk,
    whippedCream,
    wholeMilk,
} from '../shared';

const attributeInfo = new AttributeInfo(
    smallWorldCatalog,
    smallWorldAttributes
);

const repairs = new SimpleRepairs();

const idGenerator = new IDGenerator();

const cart0: LogicalCart = { items: [] };

const cart1: LogicalCart = {
    items: [
        {
            name: '',
            sku: smallCoffee.key,
            quantity: 1,
            children: [],
        },
    ],
};

const cart2: LogicalCart = {
    items: [
        cart1.items[0],
        {
            name: '',
            sku: mediumChocolateCone.key,
            quantity: 2,
            children: [],
        },
    ],
};

const cart3: LogicalCart = {
    items: [
        {
            name: '',
            sku: smallCoffee.key,
            // NOTE: quanity === 2 for "remove both options"
            // See note below.
            quantity: 2,
            children: [
                {
                    name: '',
                    sku: wholeMilk.key,
                    quantity: 1,
                    children: [],
                },
                {
                    name: '',
                    sku: whippedCream.key,
                    quantity: 1,
                    children: [],
                },
            ],
        },
        {
            name: '',
            sku: mediumChocolateCone.key,
            quantity: 2,
            children: [],
        },
    ],
};

describe('Simple Repairs (logical cart)', () => {
    it(`add default specific`, () => {
        const observed = cart0;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallCoffee.key,
                    quantity: 1,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.INSERT_A,
                cost: 1,
                steps: ['insert sku(9000:0:0:0): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`add non-default specific`, () => {
        const observed = cart0;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallIcedDecafCoffee.key,
                    quantity: 2,
                    children: [
                        {
                            name: '',
                            sku: twoMilk.key,
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.INSERT_A,
                cost: 3,
                steps: [
                    'insert sku(9000:0:1:1): ',
                    'sku(9000:0:1:1): make quantity 2',
                    '  insert sku(5000:1): ',
                ],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 3);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove first item`, () => {
        const observed = cart2;
        const expected: LogicalCart = {
            items: [cart2.items[1]],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.DELETE_A,
                cost: 1,
                steps: ['delete sku(9000:0:0:0): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove second item`, () => {
        const observed = cart2;
        const expected = cart1;

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.DELETE_A,
                cost: 1,
                steps: ['delete sku(8000:1:1): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove both items`, () => {
        const observed = cart2;
        const expected = cart0;

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.DELETE_A,
                cost: 1,
                steps: ['delete sku(9000:0:0:0): '],
            },
            {
                op: EditOp.DELETE_A,
                cost: 1,
                steps: ['delete sku(8000:1:1): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`identical items`, () => {
        const observed = cart1;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallCoffee.key,
                    quantity: 1,
                    children: [],
                },
            ],
        };

        const result = repairs.repairCart(observed, expected);
        assert.equal(result.cost, 0);
    });

    it(`repair quantity`, () => {
        const observed = cart1;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallCoffee.key,
                    quantity: 2,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['sku(9000:0:0:0): change quantity to 2'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    // This test is new for tree_repairs2. It has no analog in the unit tests
    // for tree_repairs. Replacement for
    //   repair cart/
    //     repair one attribute
    //     repair two attributes
    it(`repair product sku mismath`, () => {
        const observed = cart1;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallDecafCoffee.key,
                    quantity: 1,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 2,
                steps: ['delete sku(9000:0:0:0): ', 'insert sku(9000:0:0:1): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`add option`, () => {
        const observed = cart0;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallCoffee.key,
                    quantity: 1,
                    children: [
                        {
                            name: '',
                            sku: twoMilk.key,
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.INSERT_A,
                cost: 2,
                steps: ['insert sku(9000:0:0:0): ', '  insert sku(5000:1): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove first option`, () => {
        const observed = cart3;
        const expected: LogicalCart = {
            items: [
                {
                    ...cart3.items[0],
                    children: [cart3.items[0].children[1]],
                },
                cart3.items[1],
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['  delete sku(5000:0): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove second option`, () => {
        const observed = cart3;
        const expected: LogicalCart = {
            items: [
                {
                    ...cart3.items[0],
                    children: [cart3.items[0].children[0]],
                },
                cart3.items[1],
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['  delete sku(2000:2): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove both options`, () => {
        const observed = cart3;
        const expected: LogicalCart = {
            items: [
                {
                    ...cart3.items[0],
                    children: [],
                },
                cart3.items[1],
            ],
        };

        // NOTE: if the quantity of 9000:0:0:0 were 1, it would be just as easy
        // to delete the 9000:0:0:0 and add it again. The test uses a quantity
        // of 2 so that the expected edits are to remove the options.
        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 2,
                steps: ['  delete sku(5000:0): ', '  delete sku(2000:2): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    // This test is new for tree_repairs2. It has no analog in the unit tests
    // for tree_repairs. Replacement for
    //   repair logical cart/
    //     repair option attributes
    it(`repair option sku mismath`, () => {
        const observed = cart3;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallCoffee.key,
                    // NOTE: quanity === 2 for "remove both options"
                    // See note below.
                    quantity: 2,
                    children: [
                        {
                            name: '',
                            sku: wholeMilk.key,
                            quantity: 1,
                            children: [],
                        },
                        {
                            name: '',
                            sku: noWhippedCream.key, // CHANGED ATTRIBUTE
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
                {
                    name: '',
                    sku: mediumChocolateCone.key,
                    quantity: 2,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 2,
                steps: ['  delete sku(2000:2): ', '  insert sku(2000:0): '],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`repair option quantity`, () => {
        const observed = cart3;
        const expected: LogicalCart = {
            items: [
                {
                    name: '',
                    sku: smallCoffee.key,
                    // NOTE: quanity === 2 for "remove both options"
                    // See note below.
                    quantity: 2,
                    children: [
                        {
                            name: '',
                            sku: wholeMilk.key,
                            quantity: 5, // CHANGED QUANTITY
                            children: [],
                        },
                        {
                            name: '',
                            sku: whippedCream.key,
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
                {
                    name: '',
                    sku: mediumChocolateCone.key,
                    quantity: 2,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['  sku(5000:0): change quantity to 5'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });
});
