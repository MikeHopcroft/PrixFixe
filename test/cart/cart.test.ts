import { expect } from 'chai';
import 'mocha';

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
} from './cart_fake_data.test';
import { AttributeUtils, Cart, CartUtils, ItemInstance, KEY, PID, AID } from '../../src/';

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
        const key: KEY = 'h';

        const gen: IterableIterator<ItemInstance> = cartOps.findItemByKey(
            testCart,
            key
        );
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    it('findItemByPID()', () => {
        const pid: PID = 2;

        const gen: IterableIterator<ItemInstance> = cartOps.findItemByPID(
            testCart,
            pid
        );
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
        expect(gen.next().value).to.deep.equal(hamburger5Bread1);
    });

    it('findItemByChildKey()', () => {
        const key: KEY = 'c';

        const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildKey(
            testCart,
            key
        );
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    it('findItemByChildPID()', () => {
        const pid: PID = 1;

        const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildPID(
            testCart,
            pid
        );
        expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    });

    // it('findCompatibleItems()', () => {
    //     const gen: IterableIterator<ItemInstance> = cartOps.findCompatibleItems(cart, myOption);

    // expect(gen.next().value).to.deep.equal(hamburger4Bread0Lettuce3);
    // });

    it('findChildByKey', () => {
        const key: KEY = 'c';

        const gen: IterableIterator<ItemInstance> = cartOps.findChildByKey(
            hamburger4Bread0Lettuce3,
            key
        );
        expect(gen.next().value).to.deep.equal(lettuce3);
    });

    it('findChildByPID()', () => {
        const pid: PID = 0;

        const gen: IterableIterator<ItemInstance> = cartOps.findChildByPID(
            hamburger4Bread0Lettuce3,
            pid
        );
        expect(gen.next().value).to.deep.equal(bread0);
    });

    it('addItem()', () => {
        const cart: Cart = clone(testCart);
        const expectedCart: Cart = {
            items: [hamburger4Bread0Lettuce3, hamburger5Bread1, coke6,],
        };

        const resCart: Cart = cartOps.addItem(cart, coke6);
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('replaceItem()', () => {
        const cart: Cart = clone(testCart);
        const expectedCart: Cart = {
            items: [hamburger4Bread0Lettuce3, coke5],
        };

        const resCart: Cart = cartOps.replaceItem(cart, coke5);
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('removeItem()', () => {
        const cart: Cart = clone(testCart);
        const expectedCart: Cart = {
            items: [hamburger5Bread1,],
        };

        const resCart: Cart = cartOps.removeItem(
            cart,
            hamburger4Bread0Lettuce3
        );
        expect(resCart).to.deep.equal(expectedCart);
    });

    it('addChild()', () => {
        const parent: ItemInstance = clone(hamburger5Bread1);

        const resItem: ItemInstance = cartOps.addChild(
            parent,
            tomato3
        );
        expect(resItem).to.deep.equal(hamburger5Bread1Tomato3);
    });

    it('updateChild()', () => {
        const parent: ItemInstance = clone(hamburger4Bread0Lettuce3);

        const resItem: ItemInstance = cartOps.updateChild(
            parent,
            tomato3
        );
        expect(resItem).to.deep.equal(hamburger4Bread0Tomato3);
    });

    it('removeChild()', () => {
        const parent: ItemInstance = clone(hamburger4Bread0Lettuce3);

        const resItem: ItemInstance = cartOps.removeChild(
            parent,
            lettuce3
        );
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
    const atrOps = new AttributeUtils();

    it('createItemInstance()', () => {
        const pid: PID = 3;
        const attributes = new Set<AID>([1,2,3,]);

        const resItem: ItemInstance | undefined = atrOps.createItemInstance(pid,
            attributes);
    });
});

///////////////////////////////////////////////////////////////////////////////
//
// Test Utils
//
///////////////////////////////////////////////////////////////////////////////
const clone = (obj: Object) => {
    return JSON.parse(JSON.stringify(obj));
}