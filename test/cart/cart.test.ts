import { assert, expect } from 'chai';
import 'mocha';

import { KEY, PID, Option } from '../../src/catalog';
import {
    AID,
    AttributeUtils,
    Cart,
    CartUtils,
    ItemInstance,
    UID
} from '../../src/cart';
import { Item } from '../../src/item';
import {
    bread0,
    bread1,
    coke5,
    coke6,
    hamburger4Bread0Lettuce3,
    hamburger5Bread1,
    hamburger5Bread1Tomato3,
    hamburger4Bread0,
    hamburger4Bread0Tomato3,
    lettuce2,
    lettuce3,
    tomato3,
} from './cart_fake_data.test';
import { AttributeItem, Dimension } from '../../src/attributes';

///////////////////////////////////////////////////////////////////////////////
//
// CartUtils Tests
//
///////////////////////////////////////////////////////////////////////////////

describe('Cart', () => {
    const cartOps = new CartUtils();
    ///////////////////////////////////////////////////////////////////////////
    //
    //  CartUtils
    //
    ///////////////////////////////////////////////////////////////////////////
    it('findItemByKey()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const key: KEY = 'h';
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByKey(
            cart,
            key
        );

        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    it('findItemByPID()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const pid: PID = 2;
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByPID(
            cart,
            pid
        );

        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
        expect(gen.next().value).to.deep.equal(hamburger5Bread1);
    });

    it('findItemByChildKey()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const key: KEY = 'c';
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildKey(
            cart,
            key
        );

        for (const res of gen) {
            expect(res).to.deep.equal(hamburger4Bread0Lettuce3);
        }
    });

    it('findItemByChildPID()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const pid: PID = 1;
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildPID(
            cart,
            pid
        );

        for (const res of gen) {
            expect(res).to.deep.equal(hamburger4Bread0Lettuce3);
        }
    });

    // it('findCompatibleItems()', () => {
    //     const gen: IterableIterator<ItemInstance> = cartOps.findCompatibleItems(cart, myOption);

    //     for (let res of gen) {
    //         expect(res).to.deep.equal(hamburger4Bread0Lettuce3);
    //     }
    // });

    it('findChildByKey', () => {
        const key: KEY = 'c';
        const gen: IterableIterator<ItemInstance> = cartOps.findChildByKey(
            lettuce2,
            key
        );

        for (const res of gen) {
            expect(res).to.deep.equal(lettuce2);
        }
    });

    it('findChildByPID()', () => {
        const pid: PID = 0;
        const gen: IterableIterator<ItemInstance> = cartOps.findChildByPID(
            hamburger4Bread0Lettuce3,
            pid
        );

        for (const res of gen) {
            expect(res).to.deep.equal(bread0);
        }
    });

    it('addItem()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const expectedCart: Cart = {
            items: [
                { ...hamburger4Bread0Lettuce3 },
                { ...hamburger5Bread1 },
                { ...coke6 },
            ],
        };
        const resCart: Cart = cartOps.addItem(cart, coke6);

        expect(resCart).to.deep.equal(expectedCart);
    });

    it('replaceItem()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const expectedCart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...coke5 },],
        };
        const resCart: Cart = cartOps.replaceItem(cart, coke5);

        expect(resCart).to.deep.equal(expectedCart);
    });

    it('removeItem()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const expectedCart: Cart = {
            items: [{ ...hamburger5Bread1 },],
        };
        const resCart: Cart = cartOps.removeItem(
            cart,
            hamburger4Bread0Lettuce3
        );

        expect(resCart).to.deep.equal(expectedCart);
    });

    it('addChild()', () => {
        const parent = hamburger5Bread1;
        const child = tomato3;
        const resItem: ItemInstance = cartOps.addChild(parent, child);

        expect(resItem).to.deep.equal(hamburger5Bread1Tomato3);
    });

    it('updateChild()', () => {
        // Maybe we don't care if the entire item is deeply equal. We might
        // especially want to ignore keys.
        const resItem: ItemInstance = cartOps.updateChild(
            hamburger4Bread0Lettuce3,
            tomato3
        );

        expect(resItem).to.deep.equal(hamburger4Bread0Tomato3);
    });

    it('removeChild()', () => {
        const resItem: ItemInstance = cartOps.removeChild(
            hamburger4Bread0Tomato3,
            tomato3
        );

        // Issue here is that hamburger4Bread0 has tomato added from addChild
        expect(resItem).to.deep.equal(hamburger4Bread0);
    });

    // it('updateAttributes()', () => {
    //     const resItem: ItemInstance = cartOps.updateAttributes(myParent, myAttributes);
    // });

    ///////////////////////////////////////////////////////////////////////////
    //
    // AttributeUtils Tests
    //
    ///////////////////////////////////////////////////////////////////////////
    // const atrOps = new AttributeUtils();

    // it('createItemInstance()', () => {
    //     const resItem: ItemInstance | undefined = atrOps.createItemInstance(myPID,
    //         myAttributes);
    // });
});
