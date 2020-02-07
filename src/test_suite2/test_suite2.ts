import { ItemInstance } from "../cart";
import { AID, AttributeInfo } from "../attributes";

import { Edit, EditOp, IRepairs } from './levenshtein';
import { ICatalog } from "../catalog";

export interface LogicalItem {
    quantity: number;
    name: string;
    sku: number;
}

export interface LogicalCart {
    items: LogicalItem[];
}

export interface LogicalCartScore {
    score: number;
    explanation: string;
}

export function perfectScore(
    observed: LogicalCart,
    expected: LogicalCart
): LogicalCartScore {
    throw 0;
}

class Cost implements IRepairs<string, ItemInstance> {
    private attributeInfo: AttributeInfo;
    private catalog: ICatalog;

    constructor(
        attributeInfo: AttributeInfo,
        catalog: ICatalog
    ) {
        this.attributeInfo = attributeInfo;
        this.catalog = catalog;
    }

    delete(item: ItemInstance): Edit<string> {
        return {
            op: EditOp.DELETE_A,
            cost: 1,
            steps: [`delete ${item.quantity} item(${item.key})`],
        };
    }

    insert(item: ItemInstance): Edit<string> {
        const steps: string[] = [];
        let cost = 0;

        // Inserting the generic item's default form.
        cost += 1;
        steps.push(`insert generic item(${item.key}`);

        // Non-standard quantity
        if (item.quantity > 1) {
            // 1 if quantity greater than 1
            cost += 1;
            steps.push(`make quantity ${item.quantity}`);
        }

        //
        // Non-standard attributes.
        //
        const itemAttribs = this.attributeInfo.getAttributes(item.key);

        const generic = this.catalog.getGenericForKey(item.key);
        const defaultItem = this.catalog.getSpecific(generic.defaultKey);
        const defaultAttribs = this.attributeInfo.getAttributes(item.key);

        for (let i = 0; i < itemAttribs.length; ++i) {
            if (itemAttribs[i] !== defaultAttribs[i]) {
                // 1 for non-standard attribute
                cost += 1;
                steps.push(`non-standard attribute(${itemAttribs[i]})`);
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
            op: EditOp.DELETE_A,
            cost: 1,
            steps: [`delete ${item.quantity} item(${item.key})`],
        };
    }

    repair(existing: ItemInstance, expected: ItemInstance): Edit<string> {
        // TODO: implement
        return {
            op: EditOp.REPAIR_A,
            cost: 1000,
            steps: [`repair item(${existing.key})`],
        };
    }

    repairItem(
        observed: ItemInstance,
        expected: ItemInstance
    ): number {
        const o = observed.key.split(':');
        const e = expected.key.split(':');

        if (o[0] !== e[0]) {
            // Generics are different. Return cost to delete observed and
            // add expected.
            return this.deleteItem(observed) + this.addItem(expected);
        } else {
            // Generics are the same. Return cost to repair attributes and
            // options.
            return this.repairAttributes(observed, expected) +
                this.repairItemArrays(observed.children, expected.children);
        }
    }

    private repairAttributes(
        observed: ItemInstance,
        expected: ItemInstance
    ): number {
        // Assume on entry that observed and expected have same PID, and
        // therefore same tensor.

        const o = this.attributeInfo.getAttributes(observed.key);
        const e = this.attributeInfo.getAttributes(expected.key);

        let cost = 0;
        for (let i = 0; i < o.length; ++i) {
            if (o[i] !== e[i]) {
                // 1 for each incorrect attribute
                ++cost;
            }
        }

        return cost;
    }

    private deleteItem(observed: ItemInstance): number {
        // Assuming an item and all of its options can be delete in one
        // keystroke.
        return 1;
    }

    private addItem(expected: ItemInstance): number {
        // +1 for the generic
        let cost = 1;

        const e = this.attributeInfo.getAttributes(expected.key);
        for (const aid of e) {
            const attribute = this.getAttributeDescription(aid);
            if (!attribute.hidden) {
                // +1 for each non-hidden attribute
                // TODO: should this be for non-default?
                cost++;
            }
        }

        if (expected.quantity > 1) {
            // 1 if quantity greater than 1
            cost++;
        }

        return cost;
    }

    private repairItemArrays(
        observed: ItemInstance[],
        expected: ItemInstance[]
    ): number {
        // let cost = 0;

        // Get Levenstein cost
        // Choices are
        //   1. Delete from observed
        //   2. Add to observed
        //   3. Repair observed

        throw 0;
    }

    private getAttributeDescription(aid: AID) {
        const coordinate = this.attributeInfo.getAttributeCoordinates(aid);
        const attribute = coordinate.dimension.attributes[coordinate.position];
        return attribute;
    }
}

// function addOptions(expected: ItemInstance): number {
//     // For each child, addCost
// }

