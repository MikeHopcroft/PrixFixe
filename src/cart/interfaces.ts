import { Item } from '../item';
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

// Unique product identifer or SKU for generic products.
//export type PID = number;

// Unique product identifier or SKU for specific products.
// Shares that same value-space with GPID. Therefore, the user must ensure that
// the intersection of { GPIDs } and { SPIDs } is the empty set.
// export type SPID = number;

// Unique attribute identifier. Attributes are SKU-specifying modifiers that
// combine with a generic product to form a specific product.
export type AID = number;

// Unique instance identfier. No two ItemInstances/OptionInstances can share a
// UID. Used by React-like libraries that need to detect changes in data
// structures.
export type UID = number;

// An instance of an item in the shopping cart.
// DESIGN NOTE: The uid should be added just before returning the Cart to the
// Host, using the addIdsToCart() function in cart.ts. TODO: explain rationale.
export interface ItemInstance extends Item {
    uid?: UID;
    key: KEY;
    quantity: number;
    children: ItemInstance[];
}

// // An instance of an item in the shopping cart.
// // DESIGN NOTE: The uid should be added just before returning the Cart to the
// // Host, using the addIdsToCart() function in cart.ts. TODO: explain rationale.
// export interface OptionInstance {
//     uid?: UID;
//     spid: SPID;
//     quantity?: number;
// }

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
export interface CartOps {
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

///////////////////////////////////////////////////////////////////////////////
//
// RuleChecker
//
// Convenience methods relating to the menu and legal ItemInstance
// configurations.
//
///////////////////////////////////////////////////////////////////////////////
export interface AttributeUtilities {
    // Returns the specific product id for a generic product, configured by a
    // set of attributes. Each generic product specifies a matrix with
    // configuration dimensions. Each coordinate in this matrix corresponds to
    // a specific product. Coordinates are specified by attribute ids. When
    // there is no attribute specified for a particular dimension, the menu's
    // default attribute id is used. Attributes associated with dimensions not
    // related to the generic product will be ignored.
    //
    // Use case: pass in the GPID for the generic 'latte' product along with
    // attributes like 'large' and 'iced' in order to get the SPID for the
    // specific product 'large iced latte'.
    // TODO: ISSUE: throw or return undefined?
    createItemInstance: (
        pid: PID,
        attributes: Set<AID>,
        uid: UID,
    ) => ItemInstance | undefined;
}
