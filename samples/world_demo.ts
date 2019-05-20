import * as path from 'path';

import {
    Cart,
    setup,
} from '../src/';
import {
    testCart
} from '../test/index';
import { FakeItemFactory } from '../test';

interface State {
    cart: Cart;
    actions: [];
}

function go(debugMode: boolean) {
    const world = setup(
        path.join(__dirname, '../../samples/data/restaurant-en/menu.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/attributes.yaml'),
        debugMode
    );
    const { /*attributes, attributeInfo,*/ catalog, ops } = world;

    // Was originally of type State, but may not be necessary for now.
    let state: State = { cart: { items: [] }, actions: [] };

    const fakeFactory = new FakeItemFactory();

    fakeFactory.createItemFake(catalog, '8000:0:0');

    console.log('-----------------------------------------');
    console.log();
    console.log("SHORT-ORDER: \"Welcome to Mike's American Grill. What can I get started for you?\"");
    console.log();

    console.log('\n##### CATALOG #####');
    console.log(catalog);

    console.log('\n##### CURRENT CART #####');
    ops.printCart(state.cart);

    state.cart = testCart;
    console.log('\n##### CURRENT CART #####');
    ops.printCart(state.cart);
}

go(false);
