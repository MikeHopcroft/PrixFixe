import { KEY, PID } from '../catalog';
import {
    AID,
    AttributeUtilities,
    Cart,
    CartOps,
    ItemInstance,
    UID
} from './interfaces';
import { MatrixEntityBuilder, AttributeInfo } from '../attributes';
import { AttributeToken, ATTRIBUTE } from 'short-order';

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
        for (let child of newParent.children) {
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
    // TODO: IMPLEMENT
    updateAttributes(parent: ItemInstance, attributes: Set<AID>): ItemInstance {
        return parent;
    }
}

import { Entity, GenericEntity, genericEntityFactory, MenuItem, MENUITEM, Modifier, MODIFIER, Option, OPTION, specificEntityFactory } from '../';
///////////////////////////////////////////////////////////////////////////////
//
// AttributeUtils
//
// Convenience methods relating to the menu and legal ItemInstance
// configurations.
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeUtils implements AttributeUtilities {
    //
    // Operations involving Attributes.
    //

    constructor() { }

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
    // pid === entityId, set<AID> is the map
    createItemInstance(pid: PID, attributeIDs: Set<AID>): ItemInstance | undefined {
        // let newItem: ItemInstance = {
        //     // pid === gpid === entityId
        //     pid: pid,
        //     name: 'foo',
        //     aliases: [],
        //     uid: 5,
        //     key: 'a',
        //     quantity: 1,
        // //     children: [] // ItemInstance[]
        // // }
        // const sampleGenEntity: GenericEntity = {
        //     name:`attribute(${pid})`,
        //     pid: pid,
        //     cid: 5,
        //     aliases: [],
        //     matrix: 6,
        //     defaultKey: 'a',
        // }

        // // How to infer the kind?
        // console.log(genericEntityFactory(sampleGenEntity, MENUITEM));

        // attributeIdToCoordinate lies here. May realistically be declared
        // elsewhere
        // const info = new AttributeInfo();
        // Possibly create then add the dimensions to info before passing to
        // builder.
        // info.addDimension(someDimensionWeDontHave);
        // const builder = new MatrixEntityBuilder(info);

        // Add a coordinate before here
        // for (const attributeID of attributeIDs) {
        //     // Add size=small, allow cheese to default.
        //     // Requires unified/.
        //     builder.addAttribute(this.makeAttributeToken(attributeID));
        // }

        // For each attribute/coordinate in the set/matrix, add the specific
        // product.
        // for (const attributeID of attributeIDs) {
        // Just a number so find how to get actual product from AID
        // newItem.children.push(attribute)
        // console.log(attributeID);

        // }

        // If an attribute is not assosciated with the gpid, ignore it.

        // When there is no attribute for a particular dimension, the menu's
        // default attribute id is used.

        // Returns the specific product id for a generic product, configured by
        // a set of attributes.
        return undefined;
    }

    makeAttributeToken = (id: PID): AttributeToken => {
        return {
            type: ATTRIBUTE,
            id,
            name: `attribute(${id})`,
        };
    };
}
