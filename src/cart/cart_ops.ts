import { AID, AttributeInfo, TensorEntityBuilder } from '../attributes';
import { Catalog, Key, PID } from '../catalog';

import {
    Cart,
    FindItemPredicate,
    ICartOps,
    ItemInstance,
    UID,
} from './interfaces';

import { RuleChecker } from '../rule_checker';
import { IDGenerator } from '..//utilities';

/**
 * CartOps operates on Carts, ItemInstances, and attributes. Functionality
 * includes searching Carts and ItemInstances, modifying Carts and
 * ItemInstances, and creating new ItemInstances.
 */
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
    /**
     * Adds an item to the cart.
     *
     * @returnType a shallow copy of the cart with the item appended.
     */
    addToCart(cart: Cart, item: ItemInstance): Cart {
        return { ...cart, items: [...cart.items, item] };
    }

    /**
     * Adds a child item to a parent. Does not verify that the option is legal
     * for the item.
     *
     * @returnType a shallow copy of the parent with the child appended.
     */
    addToItem(parent: ItemInstance, child: ItemInstance): ItemInstance {
        return { ...parent, children: [...parent.children, child] };
    }

    addToItemWithReplacement(
        parent: ItemInstance,
        child: ItemInstance
    ): ItemInstance {
        let inserted = false;
        const f = this.ruleChecker.getPairwiseMutualExclusionPredicate(
            parent.key,
            child.key
        );
        const newChildren: ItemInstance[] = [];
        for (const c of parent.children) {
            if (!f(c.key)) {
                newChildren.push(c);
            } else {
                if (!inserted) {
                    inserted = true;
                    newChildren.push(child);
                }
            }
        }
        //        newChildren.push(child);
        return { ...parent, children: newChildren };
    }

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
     * @returnType an iterable of ItemInstances in the cart that correspond to a
     * particular Key.
     */
    *findByKey(cart: Cart, key: Key): IterableIterator<ItemInstance> {
        const predicate = (item: ItemInstance) => key === item.key;
        yield* this.findInCart(cart, predicate);
    }

    /**
     * Items with a PID matching the PID that is passed in are returned in the
     * order they were added to the cart.
     *
     * @useCase want to find all lattes, regardless of attributes. Searching
     * with the PID for 'latte' might return ItemInstances for a 'medium iced
     * latte' and a 'small hot latte'.
     *
     * @returnType an iterable of ItemInstances in the cart that correspond to a
     * particular PID (instance of generic entity)
     */
    *findByPID(cart: Cart, pid: PID): IterableIterator<ItemInstance> {
        const predicate = (item: ItemInstance) => {
            return pid === AttributeInfo.pidFromKey(item.key);
        };
        yield* this.findInCart(cart, predicate);
    }

    /**
     * Items with a child that have a Key matching the Key that is passed in are
     * returned in the order they were added to the cart.
     *
     * @returnType an iterable of ItemInstances that contain a child with a
     * particular Key (instance of specific entity).
     */
    *findByChildKey(cart: Cart, key: Key): IterableIterator<ItemInstance> {
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
        childKey: Key
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
        const builder = new TensorEntityBuilder(this.attributeInfo);
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
        const builder = new TensorEntityBuilder(this.attributeInfo);
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
        const builder = new TensorEntityBuilder(this.attributeInfo);
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
