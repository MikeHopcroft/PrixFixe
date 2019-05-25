import { expect } from 'chai';
import 'mocha';
import * as path from 'path';

import {
    bread0,
    coke5,
    coke6,
    hamburger4Bread0Lettuce3,
    hamburger5Bread1,
    hamburger5Bread1Tomato3,
    hamburger4Bread0,
    hamburger4Bread0Tomato3,
    lettuce3,
    testCart,
    tomato3,
} from './cart_fake_data';
import { AID, CartOld, ItemInstanceOld, KEY, PID, setup } from '../../src/';

///////////////////////////////////////////////////////////////////////////////
//
// CartUtils Tests
//
///////////////////////////////////////////////////////////////////////////////
describe('Cart', () => {
    const world = setup(
        path.join(
            __dirname,
            '../../../samples/data/restaurant-en/products.yaml'
        ),
        path.join(
            __dirname,
            '../../../samples/data/restaurant-en/options.yaml'
        ),
        path.join(
            __dirname,
            '../../../samples/data/restaurant-en/modifiers.yaml'
        ),
        path.join(
            __dirname,
            '../../../samples/data/restaurant-en/attributes.yaml'
        ),
        path.join(__dirname, '../../../samples/data/restaurant-en/rules.yaml'),
        false
    );
    const { attributeOps, attributes, cartOps, catalog } = world;
    ///////////////////////////////////////////////////////////////////////////
    //
    //  CartUtils
    //
    ///////////////////////////////////////////////////////////////////////////
    it('findItemByKey()', () => {
        const key: KEY = 'h';

        const gen: IterableIterator<ItemInstanceOld> = cartOps.findItemByKey(
            testCart,
            key
        );
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    it('findItemByPID()', () => {
        const pid: PID = 2;

        const gen: IterableIterator<ItemInstanceOld> = cartOps.findItemByPID(
            testCart,
            pid
        );
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
        expect(gen.next().value).to.deep.equal(hamburger5Bread1);
    });

    it('findItemByChildKey()', () => {
        const key: KEY = 'c';

        const gen: IterableIterator<
            ItemInstanceOld
        > = cartOps.findItemByChildKey(testCart, key);
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    it('findItemByChildPID()', () => {
        const pid: PID = 1;

        const gen: IterableIterator<
            ItemInstanceOld
        > = cartOps.findItemByChildPID(testCart, pid);
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    // it('findCompatibleItems()', () => {
    //     const gen: IterableIterator<ItemInstance> = ops.findCompatibleItems(cart, myOption);

    // expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    // });

    it('findChildByKey', () => {
        const key: KEY = 'c';

        const gen: IterableIterator<ItemInstanceOld> = cartOps.findChildByKey(
            hamburger4Bread0Lettuce3,
            key
        );
        expect(gen.next().value).to.deep.equal(lettuce3);
    });

    it('findChildByPID()', () => {
        const pid: PID = 0;

        const gen: IterableIterator<ItemInstanceOld> = cartOps.findChildByPID(
            hamburger4Bread0Lettuce3,
            pid
        );
        expect(gen.next().value).to.deep.equal(bread0);
    });

    it('addItem()', () => {
        const cart: CartOld = clone(testCart);
        const expectedCart: CartOld = {
            items: [hamburger4Bread0Lettuce3, hamburger5Bread1, coke6],
        };

        const resCart: CartOld = cartOps.addItem(cart, coke6);
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('replaceItem()', () => {
        const cart: CartOld = clone(testCart);
        const expectedCart: CartOld = {
            items: [hamburger4Bread0Lettuce3, coke5],
        };

        const resCart: CartOld = cartOps.replaceItem(cart, coke5);
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('removeItem()', () => {
        const cart: CartOld = clone(testCart);
        const expectedCart: CartOld = {
            items: [hamburger5Bread1],
        };

        const resCart: CartOld = cartOps.removeItem(
            cart,
            hamburger4Bread0Lettuce3
        );
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('addChild()', () => {
        const parent: ItemInstanceOld = clone(hamburger5Bread1);

        const resItem: ItemInstanceOld = cartOps.addChild(parent, tomato3);
        expect(resItem).to.deep.equal(hamburger5Bread1Tomato3);
    });

    it('updateChild()', () => {
        const parent: ItemInstanceOld = clone(hamburger4Bread0Lettuce3);

        const resItem: ItemInstanceOld = cartOps.updateChild(parent, tomato3);
        expect(resItem).to.deep.equal(hamburger4Bread0Tomato3);
    });

    it('removeChild()', () => {
        const parent: ItemInstanceOld = clone(hamburger4Bread0Lettuce3);

        const resItem: ItemInstanceOld = cartOps.removeChild(parent, lettuce3);
        expect(resItem).to.deep.equal(hamburger4Bread0);
    });

    // it('updateAttributes()', () => {
    //     const resItem: ItemInstance = attributeOps.updateAttributes(myParent, myAttributes);
    // });

    ///////////////////////////////////////////////////////////////////////////
    //
    // AttributeUtils Tests
    //
    ///////////////////////////////////////////////////////////////////////////
    it('createItemInstance()', () => {
        // Some PID that maps to a generic item.
        const pid: PID = 9000;
        // A set of AIDs that represent the "iced" and "decaf" attributes
        // of a  small iced decaf latte.
        const attributes = new Set<AID>([9, 11]);

        const resItem:
            | ItemInstanceOld
            | undefined = attributeOps.createItemInstance(pid, attributes);

        const expectedItem: ItemInstanceOld = {
            // UID count starts at 1, this will be the 4th item since there are
            // 3 children.
            uid: 4,
            pid: 9000,
            key: '9000:0:1:2',
            name: 'iced decaf small latte',
            quantity: 1,
            // These are added by increasing order of DID.
            children: [
                // From did = 1
                {
                    aliases: ['iced'],
                    children: [],
                    // TODO: Where do we get key from?
                    key: '0',
                    name: 'iced',
                    pid: 11,
                    quantity: 1,
                    uid: 1,
                },
                // From did = 3
                {
                    aliases: ['decaf', 'decaffeinated'],
                    children: [],
                    key: '1',
                    name: 'decaf',
                    pid: 9,
                    quantity: 1,
                    uid: 2,
                },
                // From did = 4
                {
                    aliases: ['small'],
                    children: [],
                    key: '2',
                    name: 'small',
                    pid: 1,
                    quantity: 1,
                    uid: 3,
                },
            ],
            aliases: ['latte'],
        };
        expect(resItem).to.deep.equal(expectedItem);
    });
});

///////////////////////////////////////////////////////////////////////////////
//
// Test Utils
//
///////////////////////////////////////////////////////////////////////////////
const clone = (obj: {}) => {
    return JSON.parse(JSON.stringify(obj));
};
