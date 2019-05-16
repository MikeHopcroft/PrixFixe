import { assert, expect } from 'chai';
import 'mocha';

import { KEY, Item, PID, Option } from '../../src/';
import {
    AID,
    AttributeUtils,
    Cart,
    CartUtils,
    ItemInstance,
    UID
} from '../../src/cart';
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
            items: [hamburger4Bread0Lettuce3, hamburger5Bread1,],
        };
        const key: KEY = 'h';
        // Process with the cart API.
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByKey(
            cart,
            key
        );
        // Assert the expected object equals the resulting.
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    it('findItemByPID()', () => {
        const cart: Cart = {
            items: [hamburger4Bread0Lettuce3, hamburger5Bread1,],
        };
        const pid: PID = 2;
        // Process with the cart API.
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByPID(
            cart,
            pid
        );
        // Assert the expected objects equal the resulting.
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
        expect(gen.next().value).to.deep.equal(hamburger5Bread1);
    });

    it('findItemByChildKey()', () => {
        const cart: Cart = {
            items: [hamburger4Bread0Lettuce3, hamburger5Bread1,],
        };
        const key: KEY = 'c';
        // Process with the cart API.
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildKey(
            cart,
            key
        );
        // Assert the expected object equals the resulting.
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    it('findItemByChildPID()', () => {
        const cart: Cart = {
            items: [hamburger4Bread0Lettuce3, hamburger5Bread1,],
        };
        const pid: PID = 1;
        // Process with the cart API.
        const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildPID(
            cart,
            pid
        );
        // Assert the expected object equals the resulting.
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    // it('findCompatibleItems()', () => {
    //     const gen: IterableIterator<ItemInstance> = cartOps.findCompatibleItems(cart, myOption);

    // expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    // });

    it('findChildByKey', () => {
        const key: KEY = 'c';
        // Process with the cart API.
        const gen: IterableIterator<ItemInstance> = cartOps.findChildByKey(
            hamburger4Bread0Lettuce3,
            key
        );
        // Assert the expected object equals the resulting.
        expect(gen.next().value).to.deep.equal(lettuce3);
    });

    it('findChildByPID()', () => {
        const pid: PID = 0;
        // Process with the cart API.
        const gen: IterableIterator<ItemInstance> = cartOps.findChildByPID(
            hamburger4Bread0Lettuce3,
            pid
        );
        // Assert the expected object equals the resulting.
        expect(gen.next().value).to.deep.equal(bread0);
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
        // Process with the cart API.
        const resCart: Cart = cartOps.addItem(cart, coke6);
        // Assert the expected object equals the resulting.
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('replaceItem()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const expectedCart: Cart = {
            items: [hamburger4Bread0Lettuce3, coke5],
        };
        // Process with the cart API.
        const resCart: Cart = cartOps.replaceItem(cart, coke5);
        // Assert the expected object equals the resulting.
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('removeItem()', () => {
        const cart: Cart = {
            items: [{ ...hamburger4Bread0Lettuce3 }, { ...hamburger5Bread1 },],
        };
        const expectedCart: Cart = {
            items: [hamburger5Bread1,],
        };
        // Process with the cart API.
        const resCart: Cart = cartOps.removeItem(
            cart,
            hamburger4Bread0Lettuce3
        );
        // Assert the expected object equals the resulting.
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('addChild()', () => {
        // Shallow copy any objects that will be modified by the cart API.
        const parent: ItemInstance = { ...hamburger5Bread1 }

        // Process with the cart API.
        const resItem: ItemInstance = cartOps.addChild(
            parent,
            tomato3
        );
        // Assert the expected object equals the resulting.
        expect(resItem).to.deep.equal(hamburger5Bread1Tomato3);
    });

    it('updateChild()', () => {
        // Shallow copy any objects that will be modified by the cart API.
        const parent: ItemInstance = { ...hamburger4Bread0Lettuce3 }
        // Process with the cart API.
        const resItem: ItemInstance = cartOps.updateChild(
            parent,
            tomato3
        );
        // Assert the expected object equals the resulting.
        expect(resItem).to.deep.equal(hamburger4Bread0Tomato3);
    });

    it('removeChild()', () => {
        // Shallow copy any objects that will be modified by the cart API.
        const parent: ItemInstance = { ...hamburger4Bread0Lettuce3 }
        // Process with the cart API.
        const resItem: ItemInstance = cartOps.removeChild(
            parent,
            lettuce3
        );
        // Assert the expected object equals the resulting.
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
