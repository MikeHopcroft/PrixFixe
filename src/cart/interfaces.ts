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

export type FindItemPredicate = (item: ItemInstance) => boolean;

// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
export interface ICartOps {
    ///////////////////////////////////////////////////////////////////////////
    //
    // Adding ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    // Returns a shallow copy of the Cart, with the ItemInstance appended.
    addToCart(cart: Cart, item: ItemInstance): Cart;

    // Returns a shallow copy of the ItemInstance with the OptionInstance
    // appended. Does not verify that the option is legal for the item.
    addToItem(parent: ItemInstance, child: ItemInstance): ItemInstance;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Finding ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    // Returns an iterable of ItemInstances in the cart with a particular KEY.
    // Items are returned in the order they were added to the cart.
    //
    // Use case: find all instances of a specific drink like a 'large iced
    // latte'.
    //
    findByKey(cart: Cart, key: KEY): IterableIterator<ItemInstance>;

    // Returns an iterable of ItemInstances in the cart that correspond to a
    // particular PID (instance of generic entity). Items are returned in the
    // order they were added to the cart.
    //
    // Use case: want to find all lattes, regardless of attributes. Searching
    // with the PID for 'latte' might return ItemInstances for a 'medium iced
    // latte' and a 'small hot latte'.
    //
    findByPID(cart: Cart, pid: PID): IterableIterator<ItemInstance>;

    // Returns an iterable of ItemInstances that contain an child with a
    // particular KEY (instance of specific entity). Items are returned in the
    // order they were added to the cart.
    findByChildKey(cart: Cart, key: KEY): IterableIterator<ItemInstance>;

    // Returns an iterable of ItemInstances in the cart that correspond to a
    // particular PID (instance of generic entity). Items are returned in the
    // order they were added to the cart.
    //
    // Use case: want to find all children that are lattes, regardless of their
    // attributes. Searching with the PID for 'latte' might return child
    // ItemInstances for a 'medium iced latte' and a 'small hot latte'.
    //
    findByChildPID(cart: Cart, pid: PID): IterableIterator<ItemInstance>;

    // Returns an iterable of parent ItemInstances that can legally hold a child
    // whose type is specified by `childKey`. Items are returned in the order
    // they were added to the cart.
    findCompatibleParent(
        cart: Cart,
        childKey: KEY
    ): IterableIterator<ItemInstance>;

    // Returns an iterable of ItemInstances in the Cart for which a specified
    // predicate is true. Items are returned in the order they were added to the
    // cart.
    findInCart(
        cart: Cart,
        predicate: FindItemPredicate
    ): IterableIterator<ItemInstance>;

    // Returns an iterable of ItemInstances in an array for which a specified
    // predicate is true.
    findInItemArray(
        items: ItemInstance[],
        predicate: FindItemPredicate
    ): IterableIterator<ItemInstance>;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Replacing ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    // Returns a shallow copy of the Cart, where the item that shares the new
    // item's UID is replaced with the new item.
    replaceInCart(cart: Cart, item: ItemInstance): Cart;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Removing ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    // Returns a shallow copy of the cart, omitting the item with the same UID
    // as the specified item.
    removeFromCart(cart: Cart, item: ItemInstance): Cart;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Operations relating to ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    // Creates an ItemInstance whose key is determined by the pid and aids. This
    // method generates a unique value for the ItemInstance's uid field.
    createItem(
        quantity: number,
        pid: PID,
        aids: IterableIterator<AID>,
        children: IterableIterator<ItemInstance>
    ): ItemInstance;

    // Returns a new ItemInstance whose key is derived from the original item's
    // attributes, with some being replaced by values in newAIDs.
    changeItemAttributes(
        item: ItemInstance,
        newAIDs: IterableIterator<AID>
    ): ItemInstance;

    // Returns a new ItemInstance whose key is derived from the original item's
    // attributes, with a different PID.
    changeItemPID(item: ItemInstance, newPID: PID): ItemInstance;
}
