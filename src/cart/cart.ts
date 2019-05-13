import { KEY, PID } from '../catalog';
import { AID, AttributeUtilities, Cart, CartOps, ItemInstance, UID, } from "./interfaces";

///////////////////////////////////////////////////////////////////////////////
//
// CartOps
//
// Convenience methofs to perform operations on the Cart.
//
///////////////////////////////////////////////////////////////////////////////
export class CartUtils implements CartOps {

    //
    // Operations involving Cart.
    //

    constructor() { }

    // Returns a list of ItemInstances in the cart with a particular SPID.
    // Items are returned in the order they were added to the cart.
    //
    // Use case: find all instances of a specific drink like a 'large iced
    // latte'.
    //
    // TODO: CODE REVIEW.
    *findItemByKey(cart: Cart, key: KEY): IterableIterator<ItemInstance> {
        for (const item of cart.items) {
            if (item.key === key) {
                yield item;
            }
        }
    }

    // Returns a list of ItemInstances in the cart that correspond to a
    // particular GPID. Items are returned in the order they were added to the
    // cart.
    //
    // Use case: want to find all lattes, regardless of attributes. Searching
    // with the GPID for 'latte' might return ItemInstances for a 'medium iced
    // latte' and a 'small hot latte'.
    //
    // TODO: Only returns one item instance, not ALL matching instances.
    *findItemByPID(cart: Cart, pid: PID): IterableIterator<ItemInstance> {
        for (const item of cart.items) {
            if (item.pid === pid) {
                yield item;
            }
        }
    }

    // Returns a list of ItemInstances that contain an OptionInstance with a
    // particular SPID. Items are returned in the order they were added to the
    // cart.
    //
    // ISSUE: do we want a corresponding version that finds options associated
    // with a certain generic option.
    //
    // TODO: CODE REVIEW.
    *findItemByChildKey(cart: Cart, key: KEY): IterableIterator<ItemInstance> {
        for (const item of cart.items) {
            for (const child of item.children) {
                if (child.key === key) {
                    yield item;
                }
            }
        }
    }

    // TODO: Only returns one item instance, not ALL matching instances.
    *findItemByChildPID(cart: Cart, pid: PID): IterableIterator<ItemInstance> {
        for (const item of cart.items) {
            for (const child of item.children) {
                if (child.pid === pid) {
                    yield item;
                }
            }
        }
    }

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
    //
    // TODO: IMPLEMENT. WAITING ON RULE CHECKER FUNCTIONALITY.
    *findCompatibleItems(cart: Cart, option: ItemInstance): IterableIterator<ItemInstance> {
        for (const item of cart.items) {
            // TODO: THIS IS HARDCODED TO COMPILE FOR NOW.
            if (item.pid === 5) {
                yield item;
            }
        }
    }

    //
    // Operations involving ItemInstances
    //

    // TODO: CODE REVIEW.
    *findChildByKey(item: ItemInstance, key: KEY): IterableIterator<ItemInstance> {
        for (const child of item.children) {
            if (child.key === key) {
                yield child;
            }
        }
    }

    // TODO: CODE REVIEW.
    *findChildByPID(item: ItemInstance, pid: PID): IterableIterator<ItemInstance> {
        for (const child of item.children) {
            if (child.pid === pid) {
                yield child;
            }
        }
    }

    // Returns a shallow copy of the Cart, with the ItemInstance appended.
    // TODO: CODE REVIEW.
    // ISSUE: If a hamburger is added when one is already in the cart, do we
    // simply up the quantity? Or, since keys are unique between instances,
    // do we still add a completely new instance of the duplicate item?
    addItem = (cart: Cart, item: ItemInstance): Cart => {
        // TODO: CODE REVIEW. Is this a proper shallow copy?
        let resCart: Cart = Object.assign({}, cart);
        resCart.items.push(item);
        return resCart;
    }

    // Returns a shallow copy of the Cart, where the item that shares the new
    // item's UID is replaced with the new item.
    // TODO: CODE REVIEW.
    replaceItem = (cart: Cart, repItem: ItemInstance): Cart => {
        for (let item of cart.items) {
            if (item.uid === repItem.uid) {
                // TODO: CODE REVIEW. Is this a proper shallow copy?
                item = Object.assign(item, repItem);
            }
        }
        return cart;
    }

    // Returns a shallow copy of the cart, omitting the item with the specific
    // UID.
    // TODO: ISSUE: throw or silently return when item not in cart.
    // TODO: CODE REVIEW.
    // ISSUE: NO CART PARAMTER IN THE INTERFACE, BUT ASSUMING FOR NOW THAT WE
    // NEED ONE.
    removeItem = (cart: Cart, remItem: ItemInstance): Cart => {
        for (let item of cart.items) {
            if (item.uid === remItem.uid) {
                // Remove the item
                const index = cart.items.indexOf(item);
                if (index > -1) {
                    cart.items.splice(index, 1);
                }
            }
        }
        return cart;
    }

    //
    // Operations involving OptionInstances
    //

    // Returns a shallow copy of the ItemInstance with the OptionInstance
    // appended. Does not verify that the option is legal for the item.
    //
    // TODO: CODE REVIEW.
    addChild(parent: ItemInstance, child: ItemInstance): ItemInstance {
        parent.children.push(child);
        return parent;
    }

    // Returns a shallow copy of the ItemInstance, where the option that
    // shares the new option's UID is replaced with the new option.
    //
    // TODO: CODE REVIEW.
    updateChild(parent: ItemInstance, updChild: ItemInstance): ItemInstance {
        for (let child of parent.children) {
            if (child.uid === updChild.uid) {
                // TODO: CODE REVIEW. Is this a proper shallow copy?
                child = Object.assign(child, updChild);
            }
        }
        return parent;
    }

    // Returns a shallow copy of the ItemInstance, omitting the option with
    // the specific UID.
    //
    // TODO: CODE REVIEW.
    removeChild(parent: ItemInstance, remChild: ItemInstance): ItemInstance {
        for (let child of parent.children) {
            if (child.uid === remChild.uid) {
                // Remove the item
                const index = parent.children.indexOf(child);
                if (index > -1) {
                    parent.children.splice(index, 1);
                }
            }
        }
        return parent;
    }

    // QUESTION: WHAT DOES AN ATRRIBUTES SET LOOK LIKE
    //
    // TODO: IMPLEMENT
    updateAttributes(parent: ItemInstance, attributes: Set<AID>): ItemInstance {
        return parent;
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// AttributeUtils
//
// Convenience methods relating to the menu and legal ItemInstance
// configurations.
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeUtils implements AttributeUtilities {
    // private readonly;

    constructor() {
    }

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
    // TODO: IMPLEMENT
    createItemInstance(pid: PID, attributes: Set<AID>): ItemInstance | undefined {
        return undefined;
    }
}
