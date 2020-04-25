import { assert } from 'chai';
import 'mocha';

import { AttributeInfo } from '../../src/attributes';
import { Cart } from '../../src/cart';
import {
    Edit,
    EditOp,
    MenuBasedRepairs,
    treeDiff,
} from '../../src/test_suite2';
import { IDGenerator } from '../../src/utilities';

import {
    mediumChocolateCone,
    mediumCoffee,
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

const repairs = new MenuBasedRepairs(
    attributeInfo,
    smallWorldCatalog,
    treeDiff
);

const idGenerator = new IDGenerator();

const cart0: Cart = { items: [] };

const cart1: Cart = {
    items: [
        {
            uid: idGenerator.nextId(),
            key: smallCoffee.key,
            quantity: 1,
            children: [],
        },
    ],
};

const cart2: Cart = {
    items: [
        cart1.items[0],
        {
            uid: idGenerator.nextId(),
            key: mediumChocolateCone.key,
            quantity: 2,
            children: [],
        },
    ],
};

const cart3: Cart = {
    items: [
        {
            uid: idGenerator.nextId(),
            key: smallCoffee.key,
            // NOTE: quanity === 2 for "remove both options"
            // See note below.
            quantity: 2,
            children: [
                {
                    uid: idGenerator.nextId(),
                    key: wholeMilk.key,
                    quantity: 1,
                    children: [],
                },
                {
                    uid: idGenerator.nextId(),
                    key: whippedCream.key,
                    quantity: 1,
                    children: [],
                },
            ],
        },
        {
            uid: idGenerator.nextId(),
            key: mediumChocolateCone.key,
            quantity: 2,
            children: [],
        },
    ],
};

describe('Menu-based Repairs (Cart)', () => {
    it(`add default specific`, () => {
        const observed = cart0;
        const expected: Cart = {
            items: [
                {
                    uid: 9999,
                    key: smallCoffee.key,
                    quantity: 1,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.INSERT_A,
                cost: 1,
                steps: ['id(9999): insert default item(9000:0:0:0)'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`add non-default specific`, () => {
        const observed = cart0;
        const expected: Cart = {
            items: [
                {
                    uid: 9000,
                    key: smallIcedDecafCoffee.key,
                    quantity: 2,
                    children: [
                        {
                            uid: 9001,
                            key: twoMilk.key,
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
                cost: 5,
                steps: [
                    'id(9000): insert default item(9000:0:1:1)',
                    'id(9000): make quantity 2',
                    'id(9000): non-standard attribute(5)',
                    'id(9000): non-standard attribute(7)',
                    '  id(9001): insert default item(5000:1)',
                ],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 5);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`repair non-default specific`, () => {
        const observed: Cart = {
            items: [
                {
                    uid: 9000,
                    key: mediumChocolateCone.key,
                    quantity: 2,
                    children: [
                        {
                            uid: 9001,
                            key: twoMilk.key,
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
            ],
        };

        const expected: Cart = {
            items: [
                {
                    uid: 9000,
                    key: smallIcedDecafCoffee.key,
                    quantity: 2,
                    children: [
                        {
                            uid: 9001,
                            key: twoMilk.key,
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 6,
                steps: [
                    'id(9000): delete item(8000:1:1)',
                    'id(9000): insert default item(9000:0:1:1)',
                    'id(9000): make quantity 2',
                    'id(9000): non-standard attribute(5)',
                    'id(9000): non-standard attribute(7)',
                    '  id(9001): insert default item(5000:1)',
                ],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 6);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove first item`, () => {
        const observed = cart2;
        const expected: Cart = {
            items: [cart2.items[1]],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.DELETE_A,
                cost: 1,
                steps: ['id(1): delete item(9000:0:0:0)'],
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
                steps: ['id(2): delete item(8000:1:1)'],
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
                steps: ['id(1): delete item(9000:0:0:0)'],
            },
            {
                op: EditOp.DELETE_A,
                cost: 1,
                steps: ['id(2): delete item(8000:1:1)'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`identical items`, () => {
        const observed = cart1;
        const expected: Cart = {
            items: [
                {
                    uid: idGenerator.nextId(),
                    key: smallCoffee.key,
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
        const expected: Cart = {
            items: [
                {
                    uid: idGenerator.nextId(),
                    key: smallCoffee.key,
                    quantity: 2,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['id(1): change quantity to 2'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`repair one attribute`, () => {
        const observed = cart1;
        const expected: Cart = {
            items: [
                {
                    uid: idGenerator.nextId(),
                    key: smallDecafCoffee.key,
                    quantity: 1,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['id(1): change attribute 6 to 7'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`repair two attributes`, () => {
        const observed = cart1;
        const expected: Cart = {
            items: [
                {
                    uid: idGenerator.nextId(),
                    key: mediumDecafCoffee.key,
                    quantity: 1,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 2,
                steps: [
                    'id(1): change attribute 0 to 1',
                    'id(1): change attribute 6 to 7',
                ],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`add option`, () => {
        const observed = cart0;
        const expected: Cart = {
            items: [
                {
                    uid: 1,
                    key: smallCoffee.key,
                    quantity: 1,
                    children: [
                        {
                            uid: 9001,
                            key: twoMilk.key,
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
                steps: [
                    'id(1): insert default item(9000:0:0:0)',
                    '  id(9001): insert default item(5000:1)',
                ],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove first option`, () => {
        const observed = cart3;
        const expected: Cart = {
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
                steps: ['  id(4): delete item(5000:0)'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove second option`, () => {
        const observed = cart3;
        const expected: Cart = {
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
                steps: ['  id(5): delete item(2000:2)'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`remove both options`, () => {
        const observed = cart3;
        const expected: Cart = {
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
                steps: [
                    '  id(4): delete item(5000:0)',
                    '  id(5): delete item(2000:2)',
                ],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`repair option attributes`, () => {
        const observed = cart3;
        const expected: Cart = {
            items: [
                {
                    uid: idGenerator.nextId(),
                    key: smallCoffee.key,
                    // NOTE: quanity === 2 for "remove both options"
                    // See note below.
                    quantity: 2,
                    children: [
                        {
                            uid: idGenerator.nextId(),
                            key: wholeMilk.key,
                            quantity: 1,
                            children: [],
                        },
                        {
                            uid: idGenerator.nextId(),
                            key: noWhippedCream.key, // CHANGED ATTRIBUTE
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
                {
                    uid: idGenerator.nextId(),
                    key: mediumChocolateCone.key,
                    quantity: 2,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['  id(5): change attribute 10 to 8'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });

    it(`repair option quantity`, () => {
        const observed = cart3;
        const expected: Cart = {
            items: [
                {
                    uid: idGenerator.nextId(),
                    key: smallCoffee.key,
                    // NOTE: quanity === 2 for "remove both options"
                    // See note below.
                    quantity: 2,
                    children: [
                        {
                            uid: idGenerator.nextId(),
                            key: wholeMilk.key,
                            quantity: 5, // CHANGED QUANTITY
                            children: [],
                        },
                        {
                            uid: idGenerator.nextId(),
                            key: whippedCream.key,
                            quantity: 1,
                            children: [],
                        },
                    ],
                },
                {
                    uid: idGenerator.nextId(),
                    key: mediumChocolateCone.key,
                    quantity: 2,
                    children: [],
                },
            ],
        };

        const expectedEdits: Array<Edit<string>> = [
            {
                op: EditOp.REPAIR_A,
                cost: 1,
                steps: ['  id(4): change quantity to 5'],
            },
        ];

        const result = repairs.repairCart(observed, expected);

        assert.equal(result.cost, 1);
        assert.deepEqual(result.edits, expectedEdits);
    });
});
