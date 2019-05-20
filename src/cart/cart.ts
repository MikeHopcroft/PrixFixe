import {
    AID,
    AttributeUtilities,
    Cart,
    CartOps,
    Catalog,
    IDGenerator,
    ItemInstance,
    KEY,
    PID,
    UID,
} from '../';

///////////////////////////////////////////////////////////////////////////////
//
// CartOps
//
// Convenience methofs to perform operations on the Cart.
//
///////////////////////////////////////////////////////////////////////////////
export class CartUtils implements CartOps {
    private readonly catalog: Catalog;
    
    //
    // Operations involving Cart.
    //

    constructor(catalog: Catalog) {
        this.catalog = catalog;
    }

    // Returns a list of ItemInstances in the cart with a particular SPID.
    // Items are returned in the order they were added to the cart.
    //
    // Use case: find all instances of a specific drink like a 'large iced
    // latte'.
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
    *findItemByChildKey(cart: Cart, key: KEY): IterableIterator<ItemInstance> {
        for (const item of cart.items) {
            for (const child of item.children) {
                if (child.key === key) {
                    yield item;
                }
            }
        }
    }

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
    // 1. Which item can I add this exact thing as a child of
    // 2. ? Which things can this generic thing be added to
    //      cross this bridge when we come to it
    // TODO: IMPLEMENT. WAITING ON RULE CHECKER FUNCTIONALITY.
    *findCompatibleItems(
        cart: Cart,
        option: ItemInstance
    ): IterableIterator<ItemInstance> {
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

    *findChildByKey(item: ItemInstance, key: KEY): IterableIterator<ItemInstance> {
        for (const child of item.children) {
            if (child.key === key) {
                yield child;
            }
        }
    }

    *findChildByPID(item: ItemInstance, pid: PID): IterableIterator<ItemInstance> {
        for (const child of item.children) {
            if (child.pid === pid) {
                yield child;
            }
        }
    }

    // Returns a shallow copy of the Cart, with the ItemInstance appended.
    // ISSUE: If a hamburger is added when one is already in the cart, do we
    // simply up the quantity? Or, since keys are unique between instances,
    // do we still add a completely new instance of the duplicate item?
    addItem = (cart: Cart, item: ItemInstance): Cart => {
        const newCart: Cart = { ...cart };
        newCart.items.push(item);
        return newCart;
    };

    // Returns a shallow copy of the Cart, where the item that shares the new
    // item's UID is replaced with the new item.
    replaceItem = (cart: Cart, repItem: ItemInstance): Cart => {
        const newCart: Cart = { ...cart };
        for (let item of newCart.items) {
            if (item.uid === repItem.uid) {
                item = Object.assign(item, repItem);
            }
        }
        return newCart;
    };

    // Returns a shallow copy of the cart, omitting the item with the specific
    // UID.
    // TODO: ISSUE: throw or silently return when item not in cart.
    // ISSUE: NO CART PARAMTER IN THE INTERFACE, BUT ASSUMING FOR NOW THAT WE
    // NEED ONE.
    removeItem = (cart: Cart, remItem: ItemInstance): Cart => {
        const newCart: Cart = { ...cart };
        for (const item of cart.items) {
            if (item.uid === remItem.uid) {
                // Remove the item
                const index = newCart.items.indexOf(item);
                if (index > -1) {
                    newCart.items.splice(index, 1);
                }
            }
        }
        return newCart;
    };

    //
    // Operations involving OptionInstances
    //

    // Returns a shallow copy of the ItemInstance with the OptionInstance
    // appended. Does not verify that the option is legal for the item.
    addChild(parent: ItemInstance, child: ItemInstance): ItemInstance {
        const newParent: ItemInstance = { ...parent };
        newParent.children.push(child);
        return newParent;
    }

    // Returns a shallow copy of the ItemInstance, where the option that
    // shares the new option's UID is replaced with the new option.
    updateChild(parent: ItemInstance, updChild: ItemInstance): ItemInstance {
        const newParent: ItemInstance = { ...parent };
        for (const child of newParent.children) {
            if (child.uid === updChild.uid) {
                Object.assign(child, updChild);
            }
        }
        return newParent;
    }

    // Returns a shallow copy of the ItemInstance, omitting the option with
    // the specific UID.
    removeChild(parent: ItemInstance, remChild: ItemInstance): ItemInstance {
        const newParent: ItemInstance = { ...parent };
        for (const child of newParent.children) {
            if (child.uid === remChild.uid) {
                const index = newParent.children.indexOf(child);
                if (index > -1) {
                    newParent.children.splice(index, 1);
                }
            }
        }
        return newParent;
    }

    // QUESTION: WHAT DOES AN ATRRIBUTES SET LOOK LIKE
    //   - Everything is an entity, except attributes.
    //   - ([90:1:2, 54:4:10, 18:16:2])
    //
    // Possibly add some convenience methods in matrix
    // Pull over directory into PrixFixe, make sure to grab unit tests
    // Test branch for unit tests in attributes
    //
    // TODO: IMPLEMENT IN ITS OWN BRANCH
    updateAttributes(parent: ItemInstance, attributes: Set<AID>): ItemInstance {
        /**
         * Run MEB backwards
         * From II get key
         * From key get current attributes
         * Take empty MEB, add in GPID from Key
         *     GPID:dimIndex:dimIndex
         *     Helper functions to do this in Matrix or MEB
         *     If not, stick in Matrix DO THIS IN MATRIX ANYWAY
         * Add in attr from Key
         * Add in the new attr
         *     Make sure new supercede old if MutuallyExclusive
         * Get the new Key
         * Make new II with the new keey (...II, newKey)
         */
        return parent;
    }
}

import { AttributeInfo, MatrixEntityBuilder, } from '../';
///////////////////////////////////////////////////////////////////////////////
//
// AttributeUtils
//
// Convenience methods relating to the menu and legal ItemInstance
// configurations.
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeUtils implements AttributeUtilities {
    private readonly atrInfo: AttributeInfo;
    private readonly catalog: Catalog;
    private readonly idGenerator: IDGenerator;
    //
    // Operations involving Attributes.
    //

    constructor(catalog: Catalog, idGenerator: IDGenerator, atrInfo: AttributeInfo) {
        this.atrInfo = atrInfo;
        this.catalog = catalog;
        this.idGenerator = idGenerator;
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
    createItemInstance(pid: PID, attributeIDs: Set<AID>): ItemInstance | undefined {
        if (this.catalog.hasPID(pid)) {
            const parent = this.catalog.getGeneric(pid);

            // Create the key by appending the PID, and one coordinate for each
            // dimension.
            // TODO: Generate key from MEB.
            const key: KEY = String(pid);

            const meb = new MatrixEntityBuilder(this.atrInfo);

            // TODO: Create the children from the set of AIDs.
            const children: [] = [];
            for (const attributeID of attributeIDs) {
                // Add attribute should return the attribute | undefin rather
                // than a boolean.
                const attribute = meb.addAttribute(attributeID);
                // Can't push attribute since it returns a booelan.
                // children.push(attribute)
            }

            const newItem: ItemInstance = {
                pid,
                name: parent.name,
                aliases: parent.aliases,
                uid: this.idGenerator.nextId(),
                key,
                quantity: 1, // ISSUE: Default to 1 for now.
                children,
            };
            return newItem;
        }

        // If an attribute is not assosciated with the gpid, ignore it.

        // When there is no attribute for a particular dimension, the menu's
        // default attribute id is used.

        // Returns the specific product id for a generic product, configured by
        // a set of attributes.
        return undefined;
    }
}
