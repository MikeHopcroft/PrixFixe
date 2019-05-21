// TODO: Update catalog for Prixfixe
//       API needs to be refactored
import {
    GenericTypedEntity,
    KEY,
    PID,
    MatrixID,
    SpecificTypedEntity
} from './interfaces';

//export type OptionOfPredicate = (
    //catalog: Catalog,
    //child: PID,
    //parent: PID
//) => boolean;

// TODO: No need to implement CatalogItems.
export class Catalog {
    // implements CatalogItems {
    // TODO: don't really need to store items - just the map.
    // items: ItemDescription[];
    readonly mapGeneric = new Map<PID, GenericTypedEntity>();
    readonly mapSpecific = new Map<KEY, SpecificTypedEntity>();
    //private optionOfPredicate: OptionOfPredicate | undefined;

    constructor(
        genericItems: IterableIterator<GenericTypedEntity>,
        specificItems: IterableIterator<SpecificTypedEntity>
    ) {
        this.mergeItems(genericItems, specificItems);
    }

    // Merge another Catalog into this Catalog.
    merge(other: Catalog) {
        this.mergeItems(other.mapGeneric.values(), other.mapSpecific.values());
    }

    private mergeItems(
        genericItems: IterableIterator<GenericTypedEntity>,
        specificItems: IterableIterator<SpecificTypedEntity>
    ) {
        for (const item of genericItems) {
            if (this.mapGeneric.has(item.pid)) {
                throw TypeError(
                    `Catalog: encountered duplicate pid ${item.pid}.`
                );
            }
            this.mapGeneric.set(item.pid, item);
        }

        for (const item of specificItems) {
            if (this.mapSpecific.has(item.key)) {
                throw TypeError(
                    `Catalog: encountered duplicate key ${item.key}.`
                );
            }
            this.mapSpecific.set(item.key, item);
        }
    }

    // DESGIN NOTE: can't just assign `this.map.has` to `has` because `this` won't
    // be bound correctly.
    hasPID(pid: PID) {
        return this.mapGeneric.has(pid);
    }

    getGeneric(pid: PID): GenericTypedEntity {
        const item = this.mapGeneric.get(pid);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find pid=${pid}`);
        }
        return item;
    }

    genericEntities(): IterableIterator<GenericTypedEntity> {
        return this.mapGeneric.values();
    }

    hasKEY(key: KEY) {
        return this.mapSpecific.has(key);
    }

    getSpecific(key: KEY): SpecificTypedEntity {
        const item = this.mapSpecific.get(key);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find key=${key}`);
        }
        return item;
    }

    specificEntities(): IterableIterator<SpecificTypedEntity> {
        return this.mapSpecific.values();
    }

    // TODO: MatrixID Type?
    getMatrixFromPID(pid: PID): MatrixID {
        const result = this.mapGeneric.get(pid);

        if (result) {
            return result.matrix;
        } else {
            return -1;
        }
    }

    // TODO: Either rewrite or remove this function
    //isDefaultOf(child: PID, parent: PID): boolean {
        //const p = this.get(parent);
        //return (
            //p.composition.defaults.find(
                //component => component.pid === child
            //) !== undefined
        //);
    //}

    // TODO: Remove or decide this is a facade for RuleChecker
    //getDefaultInfo(child: PID, parent: PID): ComponentDescription | undefined {
        //const p = this.get(parent);
        //return p.composition.defaults.find(
            //component => component.pid === child
        //);
    //}

    // TODO: Remove or decide this is a facade for RuleChecker
    //isChoiceOf(child: PID, parent: PID): boolean {
        //const p = this.get(parent);
        //for (const choice of p.composition.choices) {
            //if (
                //choice.alternatives.find(alternative => child === alternative)
            //) {
                //return true;
            //}
        //}
        //return false;
    //}

    // TODO: Remove or decide this is a facade for RuleChecker
    // ISSUE: This may be made obsolete by PredicateTensors
    //setOptionOfPredicate(predicate: OptionOfPredicate) {
        //this.optionOfPredicate = predicate;
    //}

    // TODO: Remove or decide this is a facade for RuleChecker
    //isOptionOf(child: PID, parent: PID): boolean {
        //if (this.optionOfPredicate) {
            //return this.optionOfPredicate(this, child, parent);
        //} else {
            //const p = this.get(parent);
            //return (
                //p.composition.options.find(option => option.pid === child) !==
                //undefined
            //);
        //}
    //}

    // TODO: Remove or decide this is a facade for RuleChecker
    // ISSUE: Is this buisiness logic in the scope of PrixFixe?
    //isSubstitutionOf(child: PID, parent: PID): boolean {
        //const p = this.get(parent);
        //return (
            //p.composition.substitutions.find(
                //substitution => substitution.replaceWith === child
            //) !== undefined
        //);
    //}

    // TODO: Remove or decide this is a facade for RuleChecker
    //isComponentOf(child: PID, parent: PID) {
        //return (
            //this.isDefaultOf(child, parent) ||
            //this.isChoiceOf(child, parent) ||
            //this.isOptionOf(child, parent) ||
            //this.isSubstitutionOf(child, parent)
        //);
    //}

    // TODO: Are notes a first class citizen in our universe?
    //isNote(pid: PID) {
        //const item = this.get(pid);
        //return item.note === true;
    //}

    // TODO: Remove or decide this is a facade for RuleChecker
    //defaultQuantity(child: PID, parent: PID) {
        //const p = this.get(parent);
        //const component = p.composition.defaults.find(
            //component => component.pid === child
        //);
        //if (component) {
            //return component.defaultQuantity;
        //} else {
            //return 0;
        //}
    //}
}
