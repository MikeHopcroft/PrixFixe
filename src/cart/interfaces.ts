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

// Unique product identifier or SKU for specific products. Shares that same
// value-space with GPID. Therefore, the user must ensure that the intersection
// of { GPIDs } and { SPIDs } is the empty set. export type SPID = number;

/**
 * Unique instance identfier. No two ItemInstances/child ItemInstances can share
 * a UID. Used by React-like libraries that need to detect changes in data
 * structures.
 */
export type UID = number;

/**
 * An instance of an item in the shopping cart.
 *
 * @designNote The UID should be added when new ItemInstances are created, using
 * the `nextId()` function in id_generator.ts.
 */
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
/**
 * A shopping cart consists of a sequence of ItemInstances. Items appear in the
 * sequence in the order they were added to the cart.
 */
export interface Cart {
    items: ItemInstance[];
}

///////////////////////////////////////////////////////////////////////////////
//
// CartOps
//
// Convenience methods to perform operations on the Cart.
//
///////////////////////////////////////////////////////////////////////////////

export type FindItemPredicate = (item: ItemInstance) => boolean;

/**
 * ICartOps operates on Carts, ItemInstances, and attributes. Functionality
 * includes searching Carts and ItemInstances, modifying Carts and
 * ItemInstances, and creating new ItemInstances.
 */
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
    /**
     * Adds an item to the cart.
     *
     * @returns a shallow copy of the cart with the item appended.
     */
    addToCart(cart: Cart, item: ItemInstance): Cart;

    /**
     * Adds a child item to a parent. Does not verify that the option is legal
     * for the item.
     *
     * @returns a shallow copy of the parent with the child appended.
     */
    addToItem(parent: ItemInstance, child: ItemInstance): ItemInstance;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Finding ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    /**
     * Items with a Key matching the Key that is passed in are returned in the
     * order they were added to the cart.
     *
     * @useCase find all instances of a specific drink like a `large iced`
     * `latte`.
     *
     * @returns an iterable of ItemInstances in the cart that correspond to a
     * particular Key.
     */
    findByKey(cart: Cart, key: KEY): IterableIterator<ItemInstance>;

    /**
     * Items with a PID matching the PID that is passed in are returned in the
     * order they were added to the cart.
     *
     * @useCase want to find all lattes, regardless of attributes. Searching
     * with the PID for `latte` might return ItemInstances for a `medium iced`
     * `latte` and a `small hot latte`.
     *
     * @returns an iterable of ItemInstances in the cart that correspond to a
     * particular PID (instance of generic entity)
     */
    findByPID(cart: Cart, pid: PID): IterableIterator<ItemInstance>;

    /**
     * Child items with a Key matching the Key that is passed in are returned in
     * the order they were added to the cart.
     *
     * @returns an iterable of ItemInstances that contain a child with a
     * particular Key (instance of specific entity).
     */
    findByChildKey(cart: Cart, key: KEY): IterableIterator<ItemInstance>;

    /**
     * Child items with a PID matching the PID that is passed in are returned in
     * the order they were added to the cart.
     *
     * @useCase want to find all children that are lattes, regardless of their
     * attributes. Searching with the PID for `latte` might return child
     * ItemInstances for a `medium iced latte` and a `small hot latte`.
     *
     * @returns an iterable of ItemInstances in the cart that correspond to a
     * particular PID (instance of generic entity).
     */
    findByChildPID(cart: Cart, pid: PID): IterableIterator<ItemInstance>;

    /**
     * Yields any parent items that the rule checker deems legal to hold the
     * child whose type is specified by `childKey`.
     *
     * @returns an iterable of parent ItemInstances that can legally hold the
     * child.
     */
    findCompatibleParent(
        cart: Cart,
        childKey: KEY
    ): IterableIterator<ItemInstance>;

    /**
     * Finds ItemInstances in the cart for which some predicate is true, then
     * returns them in the order they were added to the cart.
     *
     * @returns an iterable of ItemInstances in the Cart for which a specified
     * predicate is true.
     */
    findInCart(
        cart: Cart,
        predicate: FindItemPredicate
    ): IterableIterator<ItemInstance>;

    /**
     * Finds ItemInstances in an array for which some predicate is true.
     *
     * @returns an iterable of ItemInstances in the array for which a specified
     * predicate is true.
     */
    findInItemArray(
        items: ItemInstance[],
        predicate: FindItemPredicate
    ): IterableIterator<ItemInstance>;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Replacing ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    /**
     * @returns a shallow copy of the Cart, where the item that shares the new
     * item's UID is replaced with the new item.
     */
    replaceInCart(cart: Cart, item: ItemInstance): Cart;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Removing ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    /**
     * @returns a shallow copy of the cart, omitting the item with the same UID
     * as the one passed in.
     */
    removeFromCart(cart: Cart, uid: UID): Cart;

    ///////////////////////////////////////////////////////////////////////////
    //
    // Operations relating to ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    /**
     * Creates an ItemInstance whose Key is determined by the PID and AIDs that
     * are passed in. This method generates a unique value for the
     * ItemInstance's UID field.
     *
     * @returns a newly generated ItemInstance with a unique UID.
     */
    createItem(
        quantity: number,
        pid: PID,
        aids: IterableIterator<AID>,
        children: IterableIterator<ItemInstance>
    ): ItemInstance;

    /**
     * Creates a new ItemInstance whose Key is derived from the original item's
     * attributes, with some being replaced by values in newAIDs.
     *
     * @returns the new ItemInstance with the updated AIDs.
     */
    changeItemAttributes(
        item: ItemInstance,
        newAIDs: IterableIterator<AID>
    ): ItemInstance;

    /**
     * Creates a new ItemInstance whose key is derived from the original item's
     * attributes, with a different PID.
     *
     * @returns the new ItemInstance with the updated PID.
     */
    changeItemPID(item: ItemInstance, newPID: PID): ItemInstance;
}
