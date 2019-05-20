import { Cart, Catalog, KEY, ItemInstance, } from "../../src";

/**
 * Assume setup has been run, catalog has been created.
 *
 * ISSUE: When should UID be created? Since it's just a counter, it's probably
 * best of setup.
 */

export class FakeItemFactory {
    // Private fields.

    constructor() { }

    createItemFake(catalog: Catalog, key: KEY): ItemInstance | undefined {
        for (let mapKey of catalog.mapSpecific.keys()) {
            if (mapKey === key) {
                console.log(mapKey);
            }
        }
        return undefined;
    }

    printEntries(catalog: Catalog): void {
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
    printCart(cart: Cart) {
        if (cart.items === undefined || cart.items.length === 0) {
            console.log(`The cart is empty.`);
        } else {
            for (const item of cart.items) {
                console.log(`${item.name} ${item.uid}`);
                for (const child of item.children) {
                    console.log(`\t${child.name} ${child.uid}`);
                }
            }
        }
    }
}