import { ItemInstance } from "../cart";
import { AID, AttributeInfo } from "../attributes";


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

class Cost {
    private attributeInfo: AttributeInfo;

    constructor(attributeInfo: AttributeInfo) {
        this.attributeInfo = attributeInfo;
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

