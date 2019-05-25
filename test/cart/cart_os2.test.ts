import { assert } from 'chai';
import 'mocha';

import { Cart, CartOps2, ItemInstance, AttributeInfo } from '../../src';

import {
    mediumDecafCoffee,
    smallCoffee,
    smallChocolateCone,
    smallVanillaCone,
    smallWorldAttributes,
    smallWorldCatalog,
    soyMilk,
    wholeMilk,
} from '../shared';

const sampleCart: Cart = {
    items: [
        {
            uid: 1,
            key: smallVanillaCone.key,
            quantity: 1,
            children: [],
        },
        {
            uid: 2,
            key: smallCoffee.key,
            quantity: 1,
            children: [
                {
                    uid: 4,
                    key: soyMilk.key,
                    quantity: 2,
                    children: [],
                },
            ],
        },
        {
            uid: 3,
            key: mediumDecafCoffee.key,
            quantity: 1,
            children: [
                {
                    uid: 5,
                    key: wholeMilk.key,
                    quantity: 3,
                    children: [],
                },
            ],
        },
    ],
};

const smallVanillaConeItem: ItemInstance = {
    uid: 1,
    key: smallVanillaCone.key,
    quantity: 1,
    children: [],
};

const smallCoffeeItem: ItemInstance = {
    uid: 2,
    key: smallCoffee.key,
    quantity: 1,
    children: [],
};

const attributeInfo = new AttributeInfo(
    smallWorldCatalog,
    smallWorldAttributes
);
const ops: CartOps2 = new CartOps2(attributeInfo, smallWorldCatalog);

describe('CartOps2', () => {
    describe('Adding ItemInstanves', () => {
        it('Add to Cart', () => {
            let cart: Cart = { items: [] };

            cart = ops.addToCart(cart, smallVanillaConeItem);
            assert.deepEqual(cart, { items: [smallVanillaConeItem] });

            cart = ops.addToCart(cart, smallCoffeeItem);
            assert.deepEqual(cart, {
                items: [smallVanillaConeItem, smallCoffeeItem],
            });
        });

        it('Add to ItemInstance', () => {
            const original = { ...smallVanillaConeItem };
            const modified = ops.addToItem(original, smallCoffeeItem);

            // Look for the correct change.
            assert.deepEqual(modified, {
                ...original,
                children: [smallCoffeeItem],
            });

            // Make sure original was left unchanged.
            assert.deepEqual(original, smallVanillaConeItem);
        });
    });

    describe('Replacing ItemInstanves', () => {
        it('replaceInCart', () => {
            // The first item in sampleCart is a smallVanillaCone with UID 1.
            // Attempt to replace it with a smallChocolateCone.
            const smallChocolateConeItem: ItemInstance = {
                uid: 1,
                key: smallChocolateCone.key,
                quantity: 2,
                children: [],
            };

            const cart1 = ops.replaceInCart(sampleCart, smallChocolateConeItem);
            assert.deepEqual(cart1, {
                items: [smallChocolateConeItem, ...cart1.items.slice(1)],
            });

            // The second item in the sample cart is a smallCoffee that has a
            // soyMilk child with UID 4. Attempt to replace this child with
            // whoteMilk.
            const wholeMilkItem: ItemInstance = {
                uid: 4,
                key: wholeMilk.key,
                quantity: 3,
                children: [],
            };
            const cart2 = ops.replaceInCart(sampleCart, wholeMilkItem);
            assert.deepEqual(cart2.items, [
                cart2.items[0],
                { ...cart2.items[1], children: [wholeMilkItem] },
                ...cart2.items.slice(2),
            ]);
        });
    });

    describe('Removing ItemInstanves', () => {
        it('removeFromCart', () => {});
    });
});
