import { AID, AttributeInfo } from '../attributes';
import { KEY, PID } from '../catalog';

import { Cart, ItemInstance } from './interfaces';

type FindItemPredicate = (item: ItemInstance) => boolean;

class CartOps2 {
    ///////////////////////////////////////////////////////////////////////////
    //
    // Adding ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    addToCart(cart: Cart, item: ItemInstance): Cart {
        // TODO: use Cart updater method to ensure future Cart fields are copied.
        return { ...cart, items: [...cart.items, item] };
    }

    addToItem(parent: ItemInstance, child: ItemInstance) {
        // TODO: use ItemInstance updater method to ensure future ItemInstance fields are copied.
        return { ...parent, children: [...parent.children, child]};
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Finding ItemInstances
    //
    ///////////////////////////////////////////////////////////////////////////
    *findByKey(cart: Cart, key: KEY) {
        const predicate = (item: ItemInstance) => (key === item.key);
        yield* this.findInCart(cart, predicate);
    }

    *findByPID(cart: Cart, pid: PID) {
        const predicate = (item: ItemInstance) => {
            return pid === AttributeInfo.pidFromKey(item.key);
        };
        yield* this.findInCart(cart, predicate);
    }

    *findByChildKey(cart: Cart, key: KEY) {
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

    *findByChildPID(cart: Cart, pid: PID) {
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

    *findCompatibleParent(cart: Cart, child: ItemInstance) {
        const predicate = (item: ItemInstance) => {
            // TODO: implement with RulesChecker
            return false;
        };
        yield* this.findInCart(cart, predicate);

    }

    *findInCart(cart: Cart, predicate: FindItemPredicate): IterableIterator<ItemInstance> {
        yield* this.findInItemArray(cart.items, predicate);
    }

    *findInItemArray(items: ItemInstance[], predicate: FindItemPredicate): IterableIterator<ItemInstance> {
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
            // TODO: use cart updater method to ensure future Cart fields are copied.
            return { ...cart, items: modified };
        }
    }

    private replaceInItemArray(items: ItemInstance[], replacement: ItemInstance): ItemInstance[] {
        let changed = false;
        const modified: ItemInstance[] = [];
        for (const existing of items) {
            if (changed) {
                // If we've already swapped in the replacement, just copy existing.
                modified.push(existing);
            }
            else {
                // Otherwise, search the existing item for the replacement target.
                if (replacement.uid === existing.uid) {
                    // Replace existing item.
                    modified.push(replacement);
                    changed = true;
                }
                else {
                    // Search the existing item's children.
                    const children = this.replaceInItemArray(existing.children, replacement);
                    if (children !== replacement.children) {
                        changed = true;
                        modified.push({...existing, children});
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
    removeFromCart(cart: Cart, item: ItemInstance): Cart {
        const modified = this.removeFromItemArray(cart.items, item);
        if (modified === cart.items) {
            const message = `Cart does not have item with UID === ${item.uid}`;
            throw TypeError(message);
        } else {
            // TODO: use cart updater method to ensure future Cart fields are copied.
            return { ...cart, items: modified };
        }
    }

    private removeFromItemArray(items: ItemInstance[], remove: ItemInstance): ItemInstance[] {
        let changed = false;
        const modified: ItemInstance[] = [];
        for (const existing of items) {
            if (changed) {
                // If we've already swapped in the replacement, just copy existing.
                modified.push(existing);
            }
            else {
                // Otherwise, search the existing item for the replacement target.
                if (remove.uid === existing.uid) {
                    // Don't copy the removed item.
                    changed = true;
                }
                else {
                    // Search the existing item's children.
                    const children = this.removeFromItemArray(existing.children, remove);
                    if (children !== remove.children) {
                        changed = true;
                        modified.push({...existing, children});
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
    // createItem(
    //     quantity: number,
    //     pid: PID,
    //     aids: IterableIterator<AID>,
    //     children: IterableIterator<ItemInstance>
    // ): ItemInstance {
    //     // TODO: implement.
    // }

    // changeItemAttributes(item: ItemInstance, aids: IterableIterator<AID>): ItemInstance {
    //     // TODO: implement.
    //     // Get original attributes.
    //     // Add original pid and attributes to MatrixEntityBuilder
    //     // Add new attributes
    //     // Get new key
    // }

    // TODO: is this necessary?
    changeItemQuantity(item: ItemInstance, quantity: number): ItemInstance {
        return {...item, quantity };
    }

    // TODO: ChangeItemChildren()?

    ///////////////////////////////////////////////////////////////////////////
    //
    // Operations on Cart
    //
    ///////////////////////////////////////////////////////////////////////////
    changeCartItems(cart: Cart, items: ItemInstance[]) {
        return { ...cart, items };
    }
}
