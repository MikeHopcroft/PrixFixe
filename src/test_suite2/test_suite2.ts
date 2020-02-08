import { AttributeInfo } from "../attributes";
import { Cart, ItemInstance } from "../cart";
import { ICatalog } from "../catalog";

import {
    DiffResults,
    Edit,
    EditOp,
    IRepairs,
    levenshtein
} from './levenshtein';

export class Cost implements IRepairs<string, ItemInstance> {
    private attributeInfo: AttributeInfo;
    private catalog: ICatalog;

    constructor(
        attributeInfo: AttributeInfo,
        catalog: ICatalog
    ) {
        this.attributeInfo = attributeInfo;
        this.catalog = catalog;
    }

    repairCart(observed: Cart, expected: Cart): DiffResults<string, ItemInstance> {
        return levenshtein(this, observed.items, expected.items);
    }

    delete(item: ItemInstance): Edit<string> {
        return {
            op: EditOp.DELETE_A,
            cost: 1,
            steps: [`id(${item.uid}): delete item(${item.key})`],
        };
    }

    insert(item: ItemInstance): Edit<string> {
        const steps: string[] = [];
        let cost = 0;

        // Inserting the generic item's default form.
        cost += 1;
        steps.push(`id(${item.uid}): insert default item(${item.key}`);

        // Non-standard quantity
        if (item.quantity > 1) {
            // 1 if quantity greater than 1
            cost += 1;
            steps.push(`id(${item.uid}): make quantity ${item.quantity}`);
        }

        //
        // Non-standard attributes.
        //
        const itemAttribs = this.attributeInfo.getAttributes(item.key);

        const generic = this.catalog.getGenericForKey(item.key);
        const defaultItem = this.catalog.getSpecific(generic.defaultKey);
        const defaultAttribs = this.attributeInfo.getAttributes(defaultItem.key);

        for (let i = 0; i < itemAttribs.length; ++i) {
            if (itemAttribs[i] !== defaultAttribs[i]) {
                // 1 for non-standard attribute
                cost += 1;
                steps.push(`id(${item.uid}): non-standard attribute(${itemAttribs[i]})`);
            }
        }

        //
        // Cost of adding children.
        //
        for (const child of item.children) {
            const edit = this.insert(child);
            cost += edit.cost;
            for (const step of edit.steps) {
                steps.push(`  ` + step);
            }
        }

        return {
            op: EditOp.INSERT_A,
            cost,
            steps,
        };
    }

    repair(observed: ItemInstance, expected: ItemInstance): Edit<string> {
        let cost = 0;
        const steps: string[] = [];

        const observedPID = AttributeInfo.pidFromKey(observed.key);
        const expectedPID = AttributeInfo.pidFromKey(expected.key);
        if (observedPID !== expectedPID) {
            cost = Infinity;
        } else {
            // Repair quantity
            if (observed.quantity !== expected.quantity) {
                cost += 1;
                // TODO: need to indicate whose quantity is changed.
                // This applies to all steps.
                steps.push(`id(${observed.uid}): change quantity to ${expected.quantity}`);
            }

            // Repair attributes
            const observedAttribs = this.attributeInfo.getAttributes(observed.key);
            const expectedAttribs = this.attributeInfo.getAttributes(expected.key);
            for (let i = 0; i < observedAttribs.length; ++i) {
                if (observedAttribs[i] !== expectedAttribs[i]) {
                    cost += 1;
                    steps.push(`id(${observed.uid}): change attribute ${observedAttribs[i]} to ${expectedAttribs[i]}`);
                }
            }

            // Repair children
            const edit = levenshtein(this, observed.children, expected.children);
            cost += edit.cost;
            for (const step of edit.edits) {
                steps.push(`  ` + step);
            }
        }

        return {
            op: EditOp.REPAIR_A,
            cost,
            steps,
        };
    }

    // private repairItemArrays(
    //     observed: ItemInstance[],
    //     expected: ItemInstance[]
    // ): number {

    //     // let cost = 0;

    //     // Get Levenstein cost
    //     // Choices are
    //     //   1. Delete from observed
    //     //   2. Add to observed
    //     //   3. Repair observed

    //     throw 0;
    // }


    // repairItem(
    //     observed: ItemInstance,
    //     expected: ItemInstance
    // ): number {
    //     const o = observed.key.split(':');
    //     const e = expected.key.split(':');

    //     if (o[0] !== e[0]) {
    //         // Generics are different. Return cost to delete observed and
    //         // add expected.
    //         return this.deleteItem(observed) + this.addItem(expected);
    //     } else {
    //         // Generics are the same. Return cost to repair attributes and
    //         // options.
    //         return this.repairAttributes(observed, expected) +
    //             this.repairItemArrays(observed.children, expected.children);
    //     }
    // }

    // private repairAttributes(
    //     observed: ItemInstance,
    //     expected: ItemInstance
    // ): number {
    //     // Assume on entry that observed and expected have same PID, and
    //     // therefore same tensor.

    //     const o = this.attributeInfo.getAttributes(observed.key);
    //     const e = this.attributeInfo.getAttributes(expected.key);

    //     let cost = 0;
    //     for (let i = 0; i < o.length; ++i) {
    //         if (o[i] !== e[i]) {
    //             // 1 for each incorrect attribute
    //             ++cost;
    //         }
    //     }

    //     return cost;
    // }

    // private deleteItem(observed: ItemInstance): number {
    //     // Assuming an item and all of its options can be delete in one
    //     // keystroke.
    //     return 1;
    // }

    // private addItem(expected: ItemInstance): number {
    //     // +1 for the generic
    //     let cost = 1;

    //     const e = this.attributeInfo.getAttributes(expected.key);
    //     for (const aid of e) {
    //         const attribute = this.getAttributeDescription(aid);
    //         if (!attribute.hidden) {
    //             // +1 for each non-hidden attribute
    //             // TODO: should this be for non-default?
    //             cost++;
    //         }
    //     }

    //     if (expected.quantity > 1) {
    //         // 1 if quantity greater than 1
    //         cost++;
    //     }

    //     return cost;
    // }

    // private repairItemArrays(
    //     observed: ItemInstance[],
    //     expected: ItemInstance[]
    // ): number {
    //     // let cost = 0;

    //     // Get Levenstein cost
    //     // Choices are
    //     //   1. Delete from observed
    //     //   2. Add to observed
    //     //   3. Repair observed

    //     throw 0;
    // }

    // private getAttributeDescription(aid: AID) {
    //     const coordinate = this.attributeInfo.getAttributeCoordinates(aid);
    //     const attribute = coordinate.dimension.attributes[coordinate.position];
    //     return attribute;
    // }
}

// function addOptions(expected: ItemInstance): number {
//     // For each child, addCost
// }

