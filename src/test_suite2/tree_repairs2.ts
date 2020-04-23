import {
    LogicalCart,
    LogicalItem
} from './interfaces';


import { DiffResults, Edit, EditOp, IRepairs, treeDiff } from './tree_diff';

export class TreeRepairs2 implements IRepairs<string, LogicalItem> {
    repairCart(
        observed: LogicalCart,
        expected: LogicalCart
    ): DiffResults<string> {
        return treeDiff(this, observed.items, expected.items);
    }

    delete(item: LogicalItem): Edit<string> {
        return {
            op: EditOp.DELETE_A,
            cost: 1,
            steps: [`delete item(${item.sku})`],
        };
    }

    insert(item: LogicalItem): Edit<string> {
        const steps: string[] = [];
        let cost = 0;

        // Inserting the generic item's default form.
        cost += 1;
        steps.push(`insert default item(${item.sku})`);

        // Non-standard quantity
        if (item.quantity > 1) {
            // 1 if quantity greater than 1
            cost += 1;
            steps.push(`id(${item.sku}): make quantity ${item.quantity}`);
        }

        //
        // We don't have access to the menu, so we can't include the cost of
        // non-standard attributes.
        //

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

    repair(observed: LogicalItem, expected: LogicalItem): Edit<string> {
        let cost = 0;
        const steps: string[] = [];

        if (observed.sku !== expected.sku) {
            cost = Infinity;
        } else {
            // Repair quantity
            if (observed.quantity !== expected.quantity) {
                cost += 1;
                // TODO: need to indicate whose quantity is changed.
                // This applies to all steps.
                steps.push(
                    `id(${observed.sku}): change quantity to ${expected.quantity}`
                );
            }

            //
            // We don't have access to the menu, so we can't include the cost
            // of repairing attributes. These will be addressed by the repair
            // of a sku mismatch.
            //

            // Repair children
            const result = treeDiff(this, observed.children, expected.children);
            cost += result.cost;
            for (const edit of result.edits) {
                for (const step of edit.steps) {
                    steps.push(`  ` + step);
                }
            }
        }

        return {
            op: EditOp.REPAIR_A,
            cost,
            steps,
        };
    }
}
