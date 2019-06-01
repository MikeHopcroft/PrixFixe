import { AID, AttributeInfo, MatrixEntityBuilder } from '../attributes';
import { Catalog, KEY, PID } from '../catalog';

import {
    Cart,
    FindItemPredicate,
    ICartOps,
    ItemInstance,
    UID,
} from './interfaces';
import { IDGenerator } from '../unified';
import { RuleChecker } from '../rule_checker';

export class CartOps implements ICartOps {
    attributeInfo: AttributeInfo;
    catalog: Catalog;
    ruleChecker: RuleChecker;

    idGenerator = new IDGenerator();

    constructor(
        attributeInfo: AttributeInfo,
        catalog: Catalog,
        ruleChecker: RuleChecker
    ) {
        this.attributeInfo = attributeInfo;
        this.catalog = catalog;
        this.ruleChecker = ruleChecker;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Adding ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    // Returns a shallow copy of the Cart, with the ItemInstance appended.
    addToCart(cart: Cart, item: ItemInstance): Cart {
        return { ...cart, items: [...cart.items, item] };
    }

    // Returns a shallow copy of the ItemInstance with the OptionInstance
    // appended. Does not verify that the option is legal for the item.
    addToItem(parent: ItemInstance, child: ItemInstance): ItemInstance {
        return { ...parent, children: [...parent.children, child] };
    }

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
    *findByKey(cart: Cart, key: KEY): IterableIterator<ItemInstance> {
        const predicate = (item: ItemInstance) => key === item.key;
        yield* this.findInCart(cart, predicate);
    }

    // Returns an iterable of ItemInstances in the cart that correspond to a
    // particular PID (instance of generic entity). Items are returned in the
    // order they were added to the cart.
    //
    // Use case: want to find all lattes, regardless of attributes. Searching
    // with the PID for 'latte' might return ItemInstances for a 'medium iced
    // latte' and a 'small hot latte'.
    //
    *findByPID(cart: Cart, pid: PID): IterableIterator<ItemInstance> {
        const predicate = (item: ItemInstance) => {
            return pid === AttributeInfo.pidFromKey(item.key);
        };
        yield* this.findInCart(cart, predicate);
    }

    // Returns a list of ItemInstances that contain an OptionInstance with a
    // particular SPID. Items are returned in the order they were added to the
    // cart.
    //
    // ISSUE: do we want a corresponding version that finds options associated
    // with a certain generic option.
    *findByChildKey(cart: Cart, key: KEY): IterableIterator<ItemInstance> {
        const predicate = (item: ItemInstance) => {
            for (const child of item.children) {
                if (child.key === key) {
                    return true;
                }
            }
            return false;
        };
        yield* this.findInCart(cart, predicate);
    }

    *findByChildPID(cart: Cart, pid: PID): IterableIterator<ItemInstance> {
        const predicate = (item: ItemInstance) => {
            for (const child of item.children) {
                if (AttributeInfo.pidFromKey(child.key) === pid) {
                    return true;
                }
            }
            return false;
        };
        yield* this.findInCart(cart, predicate);
    }

    *findCompatibleParent(
        cart: Cart,
        childKey: KEY
    ): IterableIterator<ItemInstance> {
        const predicate = (item: ItemInstance) => {
            return this.ruleChecker.isValidChild(item.key, childKey);
        };
        yield* this.findInCart(cart, predicate);
    }

    *findInCart(
        cart: Cart,
        predicate: FindItemPredicate
    ): IterableIterator<ItemInstance> {
        yield* this.findInItemArray(cart.items, predicate);
    }

    *findInItemArray(
        items: ItemInstance[],
        predicate: FindItemPredicate
    ): IterableIterator<ItemInstance> {
        // Search from most recently added item
        for (let i = items.length - 1; i >= 0; --i) {
            const item = items[i];

            // Try the item
            if (predicate(item)) {
                yield item;
            }

            // Then search its children.
            if (item.children.length > 0) {
                yield* this.findInItemArray(item.children, predicate);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Replacing ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    replaceInCart(cart: Cart, item: ItemInstance): Cart {
        const modified = this.replaceInItemArray(cart.items, item);
        if (modified === cart.items) {
            const message = `Cart does not have item with UID === ${item.uid}`;
            throw TypeError(message);
        } else {
            return { ...cart, items: modified };
        }
    }

    private replaceInItemArray(
        items: ItemInstance[],
        replacement: ItemInstance
    ): ItemInstance[] {
        let changed = false;
        const modified: ItemInstance[] = [];
        for (const existing of items) {
            if (changed) {
                // If we've already swapped in the replacement, just copy
                // existing.
                modified.push(existing);
            } else {
                // Otherwise, search the existing item for the replacement
                // target.
                if (replacement.uid === existing.uid) {
                    // Replace existing item.
                    modified.push(replacement);
                    changed = true;
                } else {
                    // Search the existing item's children.
                    const children = this.replaceInItemArray(
                        existing.children,
                        replacement
                    );
                    if (children !== existing.children) {
                        changed = true;
                        modified.push({ ...existing, children });
                    } else {
                        modified.push(existing);
                    }
                }
            }
        }

        if (changed) {
            return modified;
        } else {
            return items;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Removing ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    removeFromCart(cart: Cart, uid: UID): Cart {
        const modified = this.removeFromItemArray(cart.items, uid);
        if (modified === cart.items) {
            const message = `Cart does not have item with UID === ${uid}`;
            throw TypeError(message);
        } else {
            return { ...cart, items: modified };
        }
    }

    private removeFromItemArray(
        items: ItemInstance[],
        remove: UID
    ): ItemInstance[] {
        let changed = false;
        const modified: ItemInstance[] = [];
        for (const existing of items) {
            if (changed) {
                // If we've already swapped in the replacement, just copy
                // existing.
                modified.push(existing);
            } else {
                // Otherwise, search the existing item for the replacement
                // target.
                if (remove === existing.uid) {
                    // Don't copy the removed item.
                    changed = true;
                } else {
                    // Search the existing item's children.
                    const children = this.removeFromItemArray(
                        existing.children,
                        remove
                    );
                    if (children !== existing.children) {
                        changed = true;
                        modified.push({ ...existing, children });
                    } else {
                        modified.push(existing);
                    }
                }
            }
        }

        if (changed) {
            return modified;
        } else {
            return items;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Operations on ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    createItem(
        quantity: number,
        pid: PID,
        aids: IterableIterator<AID>,
        children: IterableIterator<ItemInstance>
    ): ItemInstance {
        const builder = new MatrixEntityBuilder(this.attributeInfo);
        builder.setPID(pid);
        for (const aid of aids) {
            builder.addAttribute(aid);
        }

        return {
            uid: this.idGenerator.nextId(),
            key: builder.getKey(),
            quantity,
            children: [...children],
        };
    }

    changeItemAttributes(
        item: ItemInstance,
        newAIDs: IterableIterator<AID>
    ): ItemInstance {
        const existingAIDs = this.attributeInfo.getAttributes(item.key);
        const builder = new MatrixEntityBuilder(this.attributeInfo);
        builder.setPID(AttributeInfo.pidFromKey(item.key));

        // Copy over existing attributes.
        for (const aid of existingAIDs) {
            builder.addAttribute(aid);
        }

        // Copy over new attributes, overwriting existing attributes on same
        // dimension.
        for (const aid of newAIDs) {
            builder.setAttribute(aid);
        }

        // Return the new item, if different from original item.
        const key = builder.getKey();
        if (key !== item.key) {
            return { ...item, key: builder.getKey() };
        } else {
            return item;
        }
    }

    changeItemPID(item: ItemInstance, newPID: PID): ItemInstance {
        const existingAIDs = this.attributeInfo.getAttributes(item.key);
        const builder = new MatrixEntityBuilder(this.attributeInfo);
        builder.setPID(newPID);

        // Copy over previous attributes.
        for (const aid of existingAIDs) {
            builder.addAttribute(aid);
        }

        // Return the new item, if different from original item.
        const key = builder.getKey();
        if (key !== item.key) {
            return { ...item, key: builder.getKey() };
        } else {
            return item;
        }
    }
}