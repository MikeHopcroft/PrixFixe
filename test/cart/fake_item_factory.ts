import { ItemInstance, Catalog, KEY } from "../../src";

/**
 * Assume setup has been run, catalog has been created.
 *
 * ISSUE: When should UID be created? Since it's just a counter, it's probably
 * best in setup.
 */

export class FakeItemFactory {
    // Private fields.

    constructor() { }

    createItemFake(catalog: Catalog, key: KEY): ItemInstance | undefined {
        return undefined;
    }
}