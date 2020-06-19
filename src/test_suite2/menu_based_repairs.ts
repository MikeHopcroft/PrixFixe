import { AttributeInfo } from '../core/attributes';
import { Cart, ItemInstance } from '../core/cart';
import { ICatalog } from '../core/catalog';

import {
  DiffResults,
  Edit,
  EditOp,
  IRepairs,
  TreeDiffFunction,
} from './tree_diff';

export class MenuBasedRepairs implements IRepairs<string, ItemInstance> {
  private attributeInfo: AttributeInfo;
  private catalog: ICatalog;
  private treeDiff: TreeDiffFunction<string, ItemInstance>;

  constructor(
    attributeInfo: AttributeInfo,
    catalog: ICatalog,
    treeDiff: TreeDiffFunction<string, ItemInstance>
  ) {
    this.attributeInfo = attributeInfo;
    this.catalog = catalog;
    this.treeDiff = treeDiff;
  }

  repairCart(observed: Cart, expected: Cart): DiffResults<string> {
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

  delete(item: ItemInstance): Edit<string> {
    const name = this.catalog.getSpecific(item.key).name;
    return {
      op: EditOp.DELETE_A,
      cost: 1,
      steps: [`id(${item.uid}): delete item(${name})`],
    };
  }

  insert(item: ItemInstance): Edit<string> {
    const steps: string[] = [];
    let cost = 0;

    const generic = this.catalog.getGenericForKey(item.key);
    const defaultItem = this.catalog.getSpecific(generic.defaultKey);

    // Inserting the generic item's default form.
    cost += 1;
    steps.push(`id(${item.uid}): insert default item(${defaultItem.name})`);

    // Non-standard quantity
    if (item.quantity > 1) {
      // 1 if quantity greater than 1
      cost += 1;
      steps.push(
        `id(${item.uid}): make item(${defaultItem.name}) quantity ${item.quantity}`
      );
    }

    //
    // Non-standard attributes.
    //
    const itemAttribs = this.attributeInfo.getAttributes(item.key);
    const defaultAttribs = this.attributeInfo.getAttributes(defaultItem.key);

    for (let i = 0; i < itemAttribs.length; ++i) {
      if (itemAttribs[i] !== defaultAttribs[i]) {
        // 1 for non-standard attribute
        cost += 1;
        const a = this.attributeInfo.getAttribute(defaultAttribs[i]);
        const b = this.attributeInfo.getAttribute(itemAttribs[i]);
        steps.push(
          `id(${item.uid}): change item(${defaultItem.name}) attribute "${a.name}" to "${b.name}"`
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
      const name = this.catalog.getSpecific(observed.key).name;
      if (observed.quantity !== expected.quantity) {
        cost += 1;
        // TODO: need to indicate whose quantity is changed.
        // This applies to all steps.
        steps.push(
          `id(${observed.uid}): change item(${name}) quantity to ${expected.quantity}`
        );
      }

      // Repair attributes
      const observedAttribs = this.attributeInfo.getAttributes(observed.key);
      const expectedAttribs = this.attributeInfo.getAttributes(expected.key);
      for (let i = 0; i < observedAttribs.length; ++i) {
        if (observedAttribs[i] !== expectedAttribs[i]) {
          cost += 1;
          const o = this.attributeInfo.getAttribute(observedAttribs[i]);
          const e = this.attributeInfo.getAttribute(expectedAttribs[i]);
          steps.push(
            `id(${observed.uid}): change item(${name}) attribute "${o.name}" to "${e.name}"`
          );
        }
      }

      // Repair children
      const result = this.treeDiff(this, observed.children, expected.children);
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
