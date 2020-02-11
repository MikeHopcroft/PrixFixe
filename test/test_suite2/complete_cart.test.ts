import { assert } from 'chai';
import 'mocha';

import {
    LogicalCart,
    LogicalItem,
    cartIsComplete,
} from '../../src/test_suite2';

const option1a: LogicalItem = {
    quantity: 1,
    name: 'option1a',
    sku: '1000',
    children: [],
};

// Differs from option1a in quantity
const option1b: LogicalItem = {
    quantity: 2,
    name: 'option1b',
    sku: '1000',
    children: [],
};

// Differs from option1a in sku
const option1c: LogicalItem = {
    quantity: 1,
    name: 'option1c',
    sku: '1001',
    children: [],
};

// Differs from option1a in sku
const option2a: LogicalItem = {
    quantity: 1,
    name: 'option2a',
    sku: '2000',
    children: [],
};

// Differs from option1a in sku
const option3a: LogicalItem = {
    quantity: 1,
    name: 'option3a',
    sku: '3000',
    children: [],
};

const product1a: LogicalItem = {
    quantity: 1,
    name: 'product1a',
    sku: '1',
    children: [option1a, option2a, option3a],
};

// Differs from 1a in children order
const product1b: LogicalItem = {
    quantity: 1,
    name: 'product1b',
    sku: '1',
    children: [option3a, option2a, option1a],
};

// Differs from 1a in quantity
const product1c: LogicalItem = {
    quantity: 2,
    name: 'product1c',
    sku: '1',
    children: [option1a, option2a, option3a],
};

// Differs from 1a in sku
const product1d: LogicalItem = {
    quantity: 1,
    name: 'product1d',
    sku: '2',
    children: [option1a, option2a, option3a],
};

// Differs from 1a in children set
const product1e: LogicalItem = {
    quantity: 1,
    name: 'product1e',
    sku: '1',
    children: [option1a, option2a],
};

// Differs from 1a in first option quantity
const product1f: LogicalItem = {
    quantity: 1,
    name: 'product1f',
    sku: '1',
    children: [option1b, option2a, option3a],
};

// Differs from 1a in first option sku
const product1g: LogicalItem = {
    quantity: 1,
    name: 'product1f',
    sku: '1',
    children: [option1c, option2a, option3a],
};

const product2a: LogicalItem = {
    quantity: 1,
    name: 'product2a',
    sku: '2',
    children: [option1a, option2a],
};

const product3a: LogicalItem = {
    quantity: 1,
    name: 'product3a',
    sku: '3',
    children: [option2a, option3a],
};

const cart1: LogicalCart = { items: [product1a, product2a, product3a] };

describe('Complete Cart', () => {
    it(`identical carts`, () => {
        const cart2 = cart1;

        const complete = cartIsComplete(cart1, cart1);
        assert.isTrue(complete);
    });

    it(`reordered products complete carts`, () => {
        const cart2: LogicalCart = { items: [product3a, product2a, product1a] };

        const complete = cartIsComplete(cart1, cart2);
        assert.isTrue(complete);
    });

    it(`reordered options complete carts`, () => {
        const cart2: LogicalCart = {
            items: [
                product1b, // Differs from product1a in option order
                product2a,
                product3a,
            ],
        };

        const complete = cartIsComplete(cart1, cart2);
        assert.isTrue(complete);
    });

    it(`different set of products`, () => {
        const cart2: LogicalCart = { items: [product2a, product3a] };

        const complete = cartIsComplete(cart1, cart2);
        assert.isFalse(complete);
    });

    it(`different product quanities`, () => {
        const cart2: LogicalCart = {
            items: [
                product1c, // Differs from product1a in quantity only
                product2a,
                product3a,
            ],
        };

        const complete = cartIsComplete(cart1, cart2);
        assert.isFalse(complete);
    });

    it(`different product skus`, () => {
        const cart2: LogicalCart = {
            items: [
                product1d, // Differs from product1a in sku only
                product2a,
                product3a,
            ],
        };

        const complete = cartIsComplete(cart1, cart2);
        assert.isFalse(complete);
    });

    it(`different set of options`, () => {
        const cart2: LogicalCart = {
            items: [
                product1e, // Differs from product1a in set of options
                product2a,
                product3a,
            ],
        };

        const complete = cartIsComplete(cart1, cart2);
        assert.isFalse(complete);
    });

    it(`different option quantities`, () => {
        const cart2: LogicalCart = {
            items: [
                product1f, // Differs from product1a in first option quanity
                product2a,
                product3a,
            ],
        };

        const complete = cartIsComplete(cart1, cart2);
        assert.isFalse(complete);
    });

    it(`different option skus`, () => {
        const cart2: LogicalCart = {
            items: [
                product1g, // Differs from product1a in first option sku
                product2a,
                product3a,
            ],
        };

        const complete = cartIsComplete(cart1, cart2);
        assert.isFalse(complete);
    });
});
