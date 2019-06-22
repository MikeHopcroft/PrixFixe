import { AttributeInfo } from '../attributes';

import {
    GenericTypedEntity,
    ICatalog,
    Key,
    PID,
    SpecificTypedEntity,
} from './interfaces';

export class Catalog implements ICatalog {
    private mapGeneric = new Map<PID, GenericTypedEntity>();
    private mapSpecific = new Map<Key, SpecificTypedEntity>();
    private pidToKeys = new Map<PID, Key[]>();

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

            // Add item to map from key to SpecificTypedEntity
            this.mapSpecific.set(item.key, item);

            // Add item's key to map from pid to keys.
            const pid = AttributeInfo.pidFromKey(item.key);
            const keys = this.pidToKeys.get(pid);
            if (keys === undefined) {
                this.pidToKeys.set(pid, [item.key]);
            } else {
                keys.push(item.key);
            }
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

    getGenericForKey(key: Key): GenericTypedEntity {
        const pid = AttributeInfo.pidFromKey(key);
        return this.getGeneric(pid);
    }

    getGenericMap(): Map<PID, GenericTypedEntity> {
        return this.mapGeneric;
    }

    genericEntities(): IterableIterator<GenericTypedEntity> {
        return this.mapGeneric.values();
    }

    hasKEY(key: Key): boolean {
        return this.mapSpecific.has(key);
    }

    getSpecific(key: Key): SpecificTypedEntity {
        const item = this.mapSpecific.get(key);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find key=${key}`);
        }
        return item;
    }

    getSpecificsForGeneric(pid: PID): IterableIterator<Key> {
        if (this.pidToKeys.has(pid)) {
            return this.pidToKeys.get(pid)!.values();
        } else {
            const message = `Catalog.getSpecificsForGeneric: unknown pid ${pid}.`;
            throw TypeError(message);
        }
    }

    specificEntities(): IterableIterator<SpecificTypedEntity> {
        return this.mapSpecific.values();
    }
}
