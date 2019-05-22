import { AttributeInfo, Catalog, Dimension, PID } from '../';

// Represents a configuration matrix consisting of a set of Dimensions
// each of which corresponds to a set of Attributes.
// Used to generate entity keys.
export class Matrix {
    readonly id: PID;
    readonly dimensions: Dimension[];
    readonly catalog: Catalog;

    constructor(id: PID, dimensions: Dimension[], catalog: Catalog) {
        this.id = id;
        this.dimensions = dimensions;
        this.catalog = catalog;
    }

    // Given a map from dimensionId to attributeId, return a number that
    // represents those set of attribute values associated Dimensions of
    // this Matrix.
    getKey(
        pid: PID,
        dimensionIdToAttribute: Map<PID, PID>,
        info: AttributeInfo,
    ): string {
        const key = [pid];
        for (const [index, dimension] of this.dimensions.entries()) {
            let attributeId = dimensionIdToAttribute.get(dimension.id);
            if (attributeId === undefined) {
                // Look for default in generic pid. Probably done using the
                // index var. Dim index should line up w/ default key index.
                // attributeId = dimension.defaultAttribute;
                // attributeId = getDefaultAttributeFromGenericPID(index, entityId);
                // Check entityID - matches generic product?
                // TODO
                // Get the generic item.
                this.catalog.getGeneric(pid);
                // Get the generic items' key.
                attributeId = 0;
            }
            const coordinate = info.getAttributeCoordinates(attributeId);
            if (!coordinate) {
                const message = `unknown attribute ${attributeId}.`;
                throw TypeError(message);
            }

            key.push(coordinate.position);
        }

        return key.join(':');
    }

    hasDimension(did: PID): boolean {
        for (const dimension of this.dimensions) {
            if (dimension.id === did) {
                return true;
            }
        }
        return false;
    }
}
