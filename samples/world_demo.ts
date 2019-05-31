import * as path from 'path';

import { AID, CartOld, Catalog, setup } from '../src/';

interface State {
    cart: CartOld;
    actions: [];
}

function go(debugMode: boolean) {
    const world = setup(
        path.join(__dirname, '../../samples/data/restaurant-en/products.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/options.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/modifiers.yaml'),
        path.join(
            __dirname,
            '../../samples/data/restaurant-en/attributes.yaml'
        ),
        path.join(__dirname, '../../samples/data/restaurant-en/rules.yaml'),
        debugMode
    );
    // const { attributeOps, attributes, catalog, cartOps } = world;
    const { attributeOps, attributes, catalog } = world;

    const state: State = { cart: { items: [] }, actions: [] };

    printEntries(catalog);

    console.log('-----------------------------------------');
    console.log();
    console.log(
        'SHORT-ORDER: "Welcome to Mike\'s American Grill. What can I get started for you?"'
    );
    console.log();

    console.log('\n##### CURRENT CART #####');
    printCart(state.cart);

    const icedDecafAIDs = new Set<AID>([9, 11]);
    const icedDecafSmallLatte = attributeOps.createItemInstance(
        9000,
        icedDecafAIDs
    );
    if (icedDecafSmallLatte !== undefined) {
        state.cart.items.push(icedDecafSmallLatte);
    }
    console.log('\n##### CURRENT CART #####');
    printCart(state.cart);

    // TODO: Call a couple things that Drew might call, just to show things are
    // working end-to-end.
}

// Prints the generic and specific maps stored in the catalog.
function printEntries(catalog: Catalog): void {
    console.log(`\n##### GENERIC ENTRIES #####`);
    for (const [key, value] of catalog.mapGeneric.entries()) {
        console.log(key, value);
    }
    console.log(`\n##### SPECIFIC ENTRIES #####`);
    for (const [key, value] of catalog.mapSpecific.entries()) {
        console.log(key, value);
    }
}

// Prints the name of each parent and child item in a cart.
function printCart(cart: CartOld) {
    if (cart.items === undefined || cart.items.length === 0) {
        console.log(`The cart is empty.`);
    } else {
        for (const item of cart.items) {
            console.log(`UID(${item.uid})`);
            for (const child of item.children) {
                console.log(`\tUID(${child.uid})`);
            }
        }
    }
}

go(false);
