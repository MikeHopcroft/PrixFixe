import { AID } from '../attributes';
import { KEY, PID } from '../catalog';

///////////////////////////////////////////////////////////////////////////////
//
// Items
//
///////////////////////////////////////////////////////////////////////////////

// A generic product is a top-level item that can be combined with a set of
// attributes to form a specific product. For example, a "latte" is a generic
// product that must be configured with a size and iced vs hot to produce a
// specific product like a "small iced latte".

// Unique product identifier or SKU for specific products.
// Shares that same value-space with GPID. Therefore, the user must ensure that
// the intersection of { GPIDs } and { SPIDs } is the empty set.
// export type SPID = number;

// Unique instance identfier. No two ItemInstances/OptionInstances can share a
// UID. Used by React-like libraries that need to detect changes in data
// structures.
export type UID = number;

// An instance of an item in the shopping cart.
// DESIGN NOTE: The uid should be added just before returning the Cart to the
// Host, using the addIdsToCart() function in cart.ts. TODO: explain rationale.
export interface ItemInstance {
    uid: UID;
    key: KEY;
    quantity: number;
    children: ItemInstance[];
}

///////////////////////////////////////////////////////////////////////////////
//
// Cart
//
///////////////////////////////////////////////////////////////////////////////
// A shopping cart consists of a sequence of ItemInstance. Items appear in the
// sequence in the order they were added to the cart.
export interface Cart {
    items: ItemInstance[];
}

///////////////////////////////////////////////////////////////////////////////
//
// CartOps
//
// Convenience methofs to perform operations on the Cart.
//
///////////////////////////////////////////////////////////////////////////////

// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
export interface ICartOps {
    //
    // Operations involving Cart.
    //

    // Returns a list of ItemInstances in the cart with a particular SPID.
    // Items are returned in the order they were added to the cart.
    //
    // Use case: find all instances of a specific drink like a 'large iced latte'.
    //
    findItemByKey(cart: Cart, key: KEY): IterableIterator<ItemInstance>;

    // Returns a list of ItemInstances in the cart that correspond to a
    // particular GPID. Items are returned in the order they were added to the
    // cart.
    //
    // Use case: want to find all lattes, regardless of attributes. Searching with
    // the GPID for 'latte' might return ItemInstances for a 'medium iced latte'
    // and a 'small hot latte'.
    //
    findItemByPID(cart: Cart, pid: PID): IterableIterator<ItemInstance>;

    // Returns a list of ItemInstances that contain an OptionInstance with a
    // particular SPID. Items are returned in the order they were added to the
    // cart.
    //
    // ISSUE: do we want a corresponding version that finds options associated
    // with a certain generic option.
    findItemByChildKey(cart: Cart, key: KEY): IterableIterator<ItemInstance>;
    findItemByChildPID(cart: Cart, PID: PID): IterableIterator<ItemInstance>;

    // Returns a list of ItemInstances that are allowed to contain an
    // OptionInstance with a particular SPID. Items are returned in the order
    // they were added to the cart.
    //
    // ISSUSE: does this return ItemInstances where the OptionInstance can be
    // successfully added (e.g. not violating quantity, mutual exclusivity
    // constraints) or return ItemInstances whose SPIDs allow this type of
    // OptionInstance.
    // ISSUE: TODO: should we pass RuleChecker or get it from member variable.
    // Depends if we make a class or not.
    findCompatibleItems(
        cart: Cart,
        option: ItemInstance
    ): IterableIterator<ItemInstance>;

    //
    // Operations involving ItemInstances
    //

    findChildByKey(
        item: ItemInstance,
        key: KEY
    ): IterableIterator<ItemInstance>;
    findChildByPID(
        item: ItemInstance,
        pid: PID
    ): IterableIterator<ItemInstance>;

    // Returns a shallow copy of the Cart, with the ItemInstance appended.
    addItem: (cart: Cart, item: ItemInstance) => Cart;

    // Returns a shallow copy of the Cart, where the item that shares the new
    // item's UID is replaced with the new item.
    replaceItem: (cart: Cart, item: ItemInstance) => Cart;

    // Returns a shallow copy of the cart, omitting the item with the specific
    // UID.
    // TODO: ISSUE: throw or silently return when item not in cart.
    removeItem: (cart: Cart, item: ItemInstance) => Cart;

    //
    // Operations involving OptionInstances
    //

    // Returns a shallow copy of the ItemInstance with the OptionInstance
    // appended. Does not verify that the option is legal for the item.
    addChild(parent: ItemInstance, child: ItemInstance): ItemInstance;

    // Returns a shallow copy of the ItemInstance, where the option that
    // shares the new option's UID is replaced with the new option.
    updateChild(parent: ItemInstance, child: ItemInstance): ItemInstance;

    // Returns a shallow copy of the ItemInstance, omitting the option with
    // the specific UID.
    removeChild(parent: ItemInstance, child: ItemInstance): ItemInstance;

    updateAttributes(parent: ItemInstance, attributes: Set<AID>): ItemInstance;
}
