import { AttributeInfo } from '../attributes';
import { Cart, ItemInstance } from '../cart';
import { ICatalog } from '../catalog';

import {
    DiffResults,
    Edit,
    EditOp,
    IRepairs,
    levenshtein,
} from './levenshtein';

export class Cost implements IRepairs<string, ItemInstance> {
    private attributeInfo: AttributeInfo;
    private catalog: ICatalog;

    constructor(attributeInfo: AttributeInfo, catalog: ICatalog) {
        this.attributeInfo = attributeInfo;
        this.catalog = catalog;
    }

    repairCart(
        observed: Cart,
        expected: Cart
    ): DiffResults<string, ItemInstance> {
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
        steps.push(`id(${item.uid}): insert default item(${item.key})`);

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
        const defaultAttribs = this.attributeInfo.getAttributes(
            defaultItem.key
        );

        for (let i = 0; i < itemAttribs.length; ++i) {
            if (itemAttribs[i] !== defaultAttribs[i]) {
                // 1 for non-standard attribute
                cost += 1;
                steps.push(
                    `id(${item.uid}): non-standard attribute(${itemAttribs[i]})`
                );
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
                steps.push(
                    `id(${observed.uid}): change quantity to ${expected.quantity}`
                );
            }

            // Repair attributes
            const observedAttribs = this.attributeInfo.getAttributes(
                observed.key
            );
            const expectedAttribs = this.attributeInfo.getAttributes(
                expected.key
            );
            for (let i = 0; i < observedAttribs.length; ++i) {
                if (observedAttribs[i] !== expectedAttribs[i]) {
                    cost += 1;
                    steps.push(
                        `id(${observed.uid}): change attribute ${observedAttribs[i]} to ${expectedAttribs[i]}`
                    );
                }
            }

            // Repair children
            const edit = levenshtein(
                this,
                observed.children,
                expected.children
            );
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
}
