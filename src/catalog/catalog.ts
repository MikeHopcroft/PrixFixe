import {
    CatalogItems,
    ItemDescription,
    ParentItemDescription,
    ComponentDescription
} from './interfaces';
import { GenericTypedEntity, KEY, PID, SpecificTypedEntity } from './interfaces';

// import { }

export type OptionOfPredicate = (
    catalog: Catalog,
    child: PID,
    parent: PID
) => boolean;

// TODO: No need to implement CatalogItems.
export class Catalog {
    // implements CatalogItems {
    // TODO: don't really need to store items - just the map.
    // items: ItemDescription[];
    readonly mapGeneric = new Map<PID, GenericTypedEntity>();
    readonly mapSpecific = new Map<KEY, SpecificTypedEntity>();
    private optionOfPredicate: OptionOfPredicate | undefined;

    constructor(
        genericItems: IterableIterator<GenericTypedEntity>,
        specificItems: IterableIterator<SpecificTypedEntity>
    ) {
        // this.items = catalogItems.items;

        for (const item of genericItems) {
            if (this.mapGeneric.has(item.pid)) {
                throw TypeError(
                    `Catalog: encountered duplicate pid ${item.pid}.`
                );
            }
            this.mapGeneric.set(item.pid, item);
        }

        for (const item of specificItems) {
            if (this.mapSpecific.has(item.sku)) {
                throw TypeError(
                    `Catalog: encountered duplicate sku ${item.sku}.`
                );
            }
            this.mapSpecific.set(item.sku, item);
        }
    }

    // DESGIN NOTE: can't just assign `this.map.has` to `has` because `this` won't
    // be bound correctly.
    has(pid: PID) {
        return this.mapGeneric.has(pid);
    }

    hasSKU(sku: PID) {
        return this.mapSpecific.has(sku);
    }

    // TODO: modify get to throw if not available.
    getParent(pid: PID): ParentItemDescription {
        const item = this.mapGeneric.get(pid);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find pid=${pid}`);
        }
        return item;
    }

    // TODO: modify get to throw if not available.
    get(sku: PID): ItemDescription {
        const item = this.mapSpecific.get(sku);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find sku=${sku}`);
        }
        return item;
    }

    isDefaultOf(child: PID, parent: PID): boolean {
        const p = this.get(parent);
        return (
            p.composition.defaults.find(
                component => component.pid === child
            ) !== undefined
        );
    }

    getDefaultInfo(child: PID, parent: PID): ComponentDescription | undefined {
        const p = this.get(parent);
        return p.composition.defaults.find(
            component => component.pid === child
        );
    }

    // TODO: MatrixID Type?
    getMatrixFromPID(pid: PID): number {
        const result = this.mapGeneric.get(pid);

        if (result) {
            return result.matrix;
        } else {
            return -1;
        }
    }

    isChoiceOf(child: PID, parent: PID): boolean {
        const p = this.get(parent);
        for (const choice of p.composition.choices) {
            if (
                choice.alternatives.find(alternative => child === alternative)
            ) {
                return true;
            }
        }
        return false;
    }

    setOptionOfPredicate(predicate: OptionOfPredicate) {
        this.optionOfPredicate = predicate;
    }

    isOptionOf(child: PID, parent: PID): boolean {
        if (this.optionOfPredicate) {
            return this.optionOfPredicate(this, child, parent);
        } else {
            const p = this.get(parent);
            return (
                p.composition.options.find(option => option.pid === child) !==
                undefined
            );
        }
    }

    isSubstitutionOf(child: PID, parent: PID): boolean {
        const p = this.get(parent);
        return (
            p.composition.substitutions.find(
                substitution => substitution.replaceWith === child
            ) !== undefined
        );
    }

    isComponentOf(child: PID, parent: PID) {
        return (
            this.isDefaultOf(child, parent) ||
            this.isChoiceOf(child, parent) ||
            this.isOptionOf(child, parent) ||
            this.isSubstitutionOf(child, parent)
        );
    }

    isNote(pid: PID) {
        const item = this.get(pid);
        return item.note === true;
    }

    defaultQuantity(child: PID, parent: PID) {
        const p = this.get(parent);
        const component = p.composition.defaults.find(
            component => component.pid === child
        );
        if (component) {
            return component.defaultQuantity;
        } else {
            return 0;
        }
    }
}
