import { LogicalCart, LogicalItem } from './interfaces';

import {
    DiffResults,
    Edit,
    EditOp,
    IRepairs,
    TreeDiffFunction,
} from './tree_diff';

export class SimpleRepairs implements IRepairs<string, LogicalItem> {
    private treeDiff: TreeDiffFunction<string, LogicalItem>;

    constructor(treeDiff: TreeDiffFunction<string, LogicalItem>) {
        this.treeDiff = treeDiff;
    }

    repairCart(
        observed: LogicalCart,
        expected: LogicalCart
    ): DiffResults<string> {
        // Fixup cost to equal the number of steps.
        // This removed the small decrease in cost used to favor delete before
        // insert.
        const diff = this.treeDiff(this, observed.items, expected.items);
        let cost = 0;
        for (const edit of diff.edits) {
            edit.cost = edit.steps.length;
            cost += edit.cost;
        }
        return { ...diff, cost };
    }

    delete(item: LogicalItem): Edit<string> {
        return {
            op: EditOp.DELETE_A,
            cost: 1,
            steps: [`delete sku(${item.sku}): ${item.name}`],
        };
    }

    insert(item: LogicalItem): Edit<string> {
        const steps: string[] = [];
        let cost = 0;

        // Inserting the generic item's default form.
        cost += 1;
        steps.push(`insert sku(${item.sku}): ${item.name}`);

        // Non-standard quantity
        if (item.quantity > 1) {
            // 1 if quantity greater than 1
            cost += 1;
            steps.push(`sku(${item.sku}): make quantity ${item.quantity}`);
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
            // This case used to just set cost to Infinity.
            // Changed code to do a delete, followed by an insert
            // with the score slightly diminished so that the system
            // prefers delete-before insert. This is important for
            // working with options that cannot coexist.
            const deleteResults = this.delete(observed);
            steps.push(...deleteResults.steps);
            cost = deleteResults.cost;
            const insertResults = this.insert(expected);
            steps.push(...insertResults.steps);
            cost += insertResults.cost;
            cost -= 0.001;
        } else {
            // Repair quantity
            if (observed.quantity !== expected.quantity) {
                cost += 1;
                // TODO: need to indicate whose quantity is changed.
                // This applies to all steps.
                steps.push(
                    `sku(${observed.sku}): change quantity to ${expected.quantity}`
                );
            }

            //
            // We don't have access to the menu, so we can't include the cost
            // of repairing attributes. These will be addressed by the repair
            // of a sku mismatch.
            //

            // Repair children
            const result = this.treeDiff(
                this,
                observed.children,
                expected.children
            );
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
