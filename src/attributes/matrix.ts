// <<<<<<< HEAD
// import { AID, AttributeInfo, Catalog, DID, Dimension, MID, PID, GenericTypedEntity, KEY, } from '../';
// =======
import { Catalog, DID, GenericTypedEntity, KEY, MID, PID } from '../catalog';

import { AttributeInfo } from './attribute_info';
import { Dimension } from './dimension';
import { AID } from './interfaces';
// >>>>>>> Catalog.getGenericForKey()

// Represents a configuration matrix consisting of a set of Dimensions
// each of which corresponds to a set of Attributes.
// Used to generate entity keys.
export class Matrix {
    readonly id: MID;
    readonly dimensions: Dimension[];
    readonly catalog: Catalog;

    constructor(id: MID, dimensions: Dimension[], catalog: Catalog) {
        this.id = id;
        this.dimensions = dimensions;
        this.catalog = catalog;
    }

    // Given a map from dimensionId to attributeId, return a number that
    // represents those set of attribute values associated Dimensions of
    // this Matrix.
    getKey(
        pid: PID,
        dimensionIdToAttribute: Map<DID, AID>,
        info: AttributeInfo
    ): string {
        const key = [pid];
        let attributeIndex = 1;
        for (const [index, dimension] of this.dimensions.entries()) {
            let attributeId = dimensionIdToAttribute.get(dimension.id);
            if (attributeId === undefined) {
                attributeId = this.getDefaultAttribute(pid, attributeIndex);
            }
            const coordinate = info.getAttributeCoordinates(attributeId);
            if (!coordinate) {
                const message = `unknown attribute ${attributeId}.`;
                throw TypeError(message);
            }

            key.push(coordinate.position);
            attributeIndex++;
        }
        return key.join(':');
    }

    hasDimension(did: DID): boolean {
        for (const dimension of this.dimensions) {
            if (dimension.id === did) {
                return true;
            }
        }
        return false;
    }

    getDefaultAttribute(id: PID, index: number): AID {
        // Get the generic item.
        const genericItem: GenericTypedEntity = this.catalog.getGeneric(id);
        // Get the generic item's defaultKey.
        const defaultKey: KEY = genericItem.defaultKey;

        return Number(defaultKey.split(':')[index]) as AID;
    }

    static pidFromKey(key: KEY) {
        const pid = Number.parseInt(key, 10);
        if (isNaN(pid)) {
            throw TypeError(`Bad key "${key}""`);
        }

        return pid;
    }
}
