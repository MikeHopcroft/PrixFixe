import { AttributeInfo } from '../attributes';

import {
    GenericTypedEntity,
    ICatalog,
    KEY,
    PID,
    SpecificTypedEntity,
} from './interfaces';

export class Catalog implements ICatalog {
    mapGeneric = new Map<PID, GenericTypedEntity>();
    mapSpecific = new Map<KEY, SpecificTypedEntity>();

    static fromEntities(
        genericItems: IterableIterator<GenericTypedEntity>,
        specificItems: IterableIterator<SpecificTypedEntity>
    ): Catalog {
        const catalog = new Catalog();
        catalog.mergeItems(genericItems, specificItems);
        return catalog;
    }

    static fromCatalog(other: Catalog): Catalog {
        const catalog = new Catalog();
        catalog.merge(other);
        return catalog;
    }

    /**
     * @designIntent construct via factories.
     */
    private constructor() {}

    /**
     * Merge another Catalog into this Catalog.
     */
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

    /**
     * @designNote can't just assign `this.map.has` to `has` because `this`
     * won't be bound correctly.
     */
    hasPID(pid: PID): boolean {
        return this.mapGeneric.has(pid);
    }

    getGeneric(pid: PID): GenericTypedEntity {
        const item = this.mapGeneric.get(pid);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find pid=${pid}`);
        }
        return item;
    }

    getGenericForKey(key: KEY): GenericTypedEntity {
        const pid = AttributeInfo.pidFromKey(key);
        return this.getGeneric(pid);
    }

    genericEntities(): IterableIterator<GenericTypedEntity> {
        return this.mapGeneric.values();
    }

    hasKEY(key: KEY): boolean {
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
}
