import { assert } from 'chai';
import 'mocha';

import {
    Cart,
    CartOps2,
    ItemInstance,
    AttributeInfo,
    RuleChecker,
} from '../../src';

import {
    caffeineDecaf,
    genericCoffeePID,
    genericCone,
    genericMilkPID,
    mediumDecafCoffee,
    sizeMedium,
    sizeSmall,
    smallCoffee,
    smallChocolateCone,
    smallIcedDecafCoffee,
    smallVanillaCone,
    smallWorldAttributes,
    smallWorldCatalog,
    smallWorldRuleChecker,
    soyMilk,
    temperatureCold,
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

const ops: CartOps2 = new CartOps2(
    attributeInfo,
    smallWorldCatalog,
    smallWorldRuleChecker
);

describe('CartOps2', () => {
    describe('Adding ItemInstances', () => {
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

    describe('Replacing ItemInstances', () => {
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

    describe('Removing ItemInstances', () => {
        it('removeFromCart', () => {
            const remove1 = sampleCart.items[1].children[0];
            const remove2 = sampleCart.items[1];
            const remove3 = sampleCart.items[2];
            const remove4 = sampleCart.items[0];

            const cart1 = ops.removeFromCart(sampleCart, remove1);
            assert.deepEqual(cart1.items, [
                sampleCart.items[0],
                { ...sampleCart.items[1], children: [] },
                sampleCart.items[2],
            ]);

            const cart2 = ops.removeFromCart(cart1, remove2);
            assert.deepEqual(cart2.items, [
                sampleCart.items[0],
                sampleCart.items[2],
            ]);

            const cart3 = ops.removeFromCart(cart2, remove3);
            assert.deepEqual(cart3.items, [sampleCart.items[0]]);

            const cart4 = ops.removeFromCart(cart3, remove4);
            assert.deepEqual(cart4.items, []);
        });
    });

    describe('ItemInstance operations', () => {
        it('createItem', () => {
            const pid = genericCoffeePID;
            const quantity = 5;
            const aids = [sizeMedium, caffeineDecaf];
            const child: ItemInstance = {
                uid: 9999,
                quantity: 2,
                key: wholeMilk.key,
                children: [],
            };

            const item = ops.createItem(
                quantity,
                pid,
                aids.values(),
                [child].values()
            );

            // Use value of 1 for UIDs since we don't know what UID to expect.
            assert.deepEqual(
                { ...item, uid: 1 },
                {
                    uid: 1,
                    key: mediumDecafCoffee.key,
                    quantity,
                    children: [child],
                }
            );
        });

        it('UIDs are unique', () => {
            const pid = genericCoffeePID;
            const quantity = 5;
            const aids = [sizeMedium, caffeineDecaf];

            const item1 = ops.createItem(
                quantity,
                pid,
                aids.values(),
                [].values()
            );
            const item2 = ops.createItem(
                quantity,
                pid,
                aids.values(),
                [].values()
            );

            assert.equal(item1.uid + 1, item2.uid);
        });

        it('changeItemAttributes', () => {
            const original = {
                uid: 1,
                key: mediumDecafCoffee.key,
                quantity: 5,
                children: [],
            };

            const observed = ops.changeItemAttributes(
                original,
                [temperatureCold, sizeSmall].values()
            );

            const expected = {
                uid: 1,
                key: smallIcedDecafCoffee.key,
                quantity: 5,
                children: [],
            };

            assert.deepEqual(observed, expected);
        });

        it('changeItemPID', () => {
            const original = {
                uid: 1,
                key: smallCoffee.key,
                quantity: 5,
                children: [],
            };

            const observed = ops.changeItemPID(original, genericCone.pid);

            const expected = {
                uid: 1,
                key: smallVanillaCone.key,
                quantity: 5,
                children: [],
            };

            assert.deepEqual(observed, expected);
        });
    });

    describe('Find operations', () => {
        it('findByKey', () => {
            const items = [...ops.findByKey(sampleCart, soyMilk.key)];
            const uids = items.map(x => x.uid);
            assert.deepEqual(uids, [4]);
        });

        it('findByPID', () => {
            const items = [...ops.findByPID(sampleCart, genericCoffeePID)];
            const uids = items.map(x => x.uid);
            assert.deepEqual(uids, [3, 2]);
        });

        it('findByChildKey', () => {
            const items = [...ops.findByChildKey(sampleCart, wholeMilk.key)];
            const uids = items.map(x => x.uid);
            assert.deepEqual(uids, [3]);
        });

        it('findByChildPID', () => {
            const items = [...ops.findByChildPID(sampleCart, genericMilkPID)];
            const uids = items.map(x => x.uid);
            assert.deepEqual(uids, [3, 2]);
        });

        it('findByCompatibleParent', () => {
            const items = [
                ...ops.findCompatibleParent(sampleCart, wholeMilk.key),
            ];
            const uids = items.map(x => x.uid);
            assert.deepEqual(uids, [3, 2]);
        });
    });
});
