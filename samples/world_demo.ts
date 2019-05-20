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
    const { atrOps, attributes, attributeInfo, catalog, cartOps } = world;

    // Was originally of type State, but may not be necessary for now.
    const state: State = { cart: { items: [] }, actions: [] };

    const fakeFactory = new FakeItemFactory();

    // fakeFactory.printEntries(catalog);

    console.log('-----------------------------------------');
    console.log();
    console.log("SHORT-ORDER: \"Welcome to Mike's American Grill. What can I get started for you?\"");
    console.log();

    console.log('\n##### CURRENT CART #####');
    fakeFactory.printCart(state.cart);

    state.cart = testCart;
    console.log('\n##### CURRENT CART #####');
    fakeFactory.printCart(state.cart);
}

go(false);
