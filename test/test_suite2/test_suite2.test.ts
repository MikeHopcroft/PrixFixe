import { assert } from 'chai';
import 'mocha';

import { AttributeInfo } from '../../src/attributes';
import { Cart, ItemInstance } from '../../src/cart';
import { Cost, Edit, EditOp } from '../../src/test_suite2';
import { IDGenerator } from '../../src/utilities';

import {
    mediumChocolateCone,
    mediumDecafCoffee,
    smallCoffee,
    smallDecafCoffee,
    smallWorldAttributes,
    smallWorldCatalog,
    smallIcedDecafCoffee,
    twoMilk,
} from '../shared';

const attributeInfo = new AttributeInfo(
    smallWorldCatalog,
    smallWorldAttributes
);

const cost = new Cost(attributeInfo, smallWorldCatalog);

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

describe('Repair', () => {
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

        const result = cost.repairCart(observed, expected);

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

        const result = cost.repairCart(observed, expected);

        assert.equal(result.cost, 5);
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

        const result = cost.repairCart(observed, expected);

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

        const result = cost.repairCart(observed, expected);

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

        const result = cost.repairCart(observed, expected);

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

        const result = cost.repairCart(observed, expected);
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

        const result = cost.repairCart(observed, expected);

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

        const result = cost.repairCart(observed, expected);

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

        const result = cost.repairCart(observed, expected);

        assert.equal(result.cost, 2);
        assert.deepEqual(result.edits, expectedEdits);
    });

    // Add option
    // Remove first option
    // Remove second option
    // Remove both options
    // Repair option quantity
    // Repair option attribute
});
