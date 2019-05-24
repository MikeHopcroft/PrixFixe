import { Catalog, DID, GenericTypedEntity, KEY, PID } from '../catalog';
import { MID } from '../attributes';

import { Dimension } from './dimension';
import { AID, Attributes, MatrixDescription } from './interfaces';
import { Matrix } from './matrix';

// The (dimension, position) coordinates of an attribute within a Matrix.
// Dimension corresponds to a characteristic like `size`.
// Position corresponds to a specific characteristic value such as `small`,
// 'medium`, or `large`.
export interface AttributeCoordinate {
    dimension: Dimension;
    position: number;
}

// Store information about the relationships between Attributes,
// Dimensions, and Matrices.
export class AttributeInfo {
    private readonly catalog: Catalog;
    private readonly dimensionIdToDimension = new Map<PID, Dimension>();
    private readonly attributeIdToCoordinate = new Map<
        PID,
        AttributeCoordinate
    >();
    private readonly matrixIdToMatrix = new Map<PID, Matrix>();

    constructor(catalog: Catalog, attributes: Attributes) {
        this.catalog = catalog;

        for (const dimension of attributes.dimensions) {
            this.addDimension(
                new Dimension(dimension.did, dimension.items.values())
            );
        }

        for (const matrix of attributes.matrices) {
            // TODO: check for bad/unknown `did`.
            const dimensions: Dimension[] = [];
            for (const did of matrix.dimensions) {
                const dimension = this.dimensionIdToDimension.get(did);
                if (!dimension) {
                    const message = `unknown dimension id ${did}.`;
                    throw TypeError(message);
                }
                dimensions.push(dimension);
            }
            this.addMatrix({ mid: matrix.mid, dimensions });
        }
    }

    // Indexes a Dimension and its Attributes.
    private addDimension(dimension: Dimension) {
        if (this.dimensionIdToDimension.has(dimension.id)) {
            const message = `found duplicate dimension id ${dimension.id}.`;
            throw new TypeError(message);
        }
        this.dimensionIdToDimension.set(dimension.id, dimension);

        let position = 0;
        for (const attribute of dimension.attributes) {
            if (this.attributeIdToCoordinate.has(attribute.aid)) {
                const message = `found duplicate attribute pid ${
                    attribute.aid
                    }.`;
                throw new TypeError(message);
            }
            this.attributeIdToCoordinate.set(attribute.aid, {
                dimension,
                position,
            });

            position++;
        }
    }

    // Indexes a Matrix.
    private addMatrix(matrix: Matrix) {
        if (this.matrixIdToMatrix.has(matrix.mid)) {
            const message = `found duplicate matrix id ${matrix.mid}.`;
            throw new TypeError(message);
        }
        this.matrixIdToMatrix.set(matrix.mid, matrix);
    }

    // Lookup an AttributeCoordinate by AID. The Coordinate provides the
    // Attribute's Dimension (e.g. size) and its Position in the Dimension
    // (e.g. 0 ==> small).
    getAttributeCoordinates(aid: AID): AttributeCoordinate {
        const coordinate = this.attributeIdToCoordinate.get(aid);
        if (coordinate === undefined) {
            const message = `Unknown attribute id ${aid}.`;
            throw TypeError(message);
        }
        return coordinate;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Matrix-related methods
    //
    ///////////////////////////////////////////////////////////////////////////

    getMatrix(mid: MID) {
        const matrix = this.matrixIdToMatrix.get(mid);
        if (matrix === undefined) {
            const message = `Bad matrix id ${mid}.`;
            throw message;
        }
        return matrix;
    }

    // Returns a GenericEntity's Matrix.
    getMatrixForEntity(pid: PID): Matrix {
        const genericEntity = this.catalog.getGeneric(pid);
        return this.getMatrix(genericEntity.matrix);
    }

    // Given a map from dimensionId to attributeId, return a number that
    // represents those set of attribute values associated Dimensions of
    // this Matrix.
    getKey(
        pid: PID,
        dimensionIdToAttribute: Map<DID, AID>
    ): string {
        const matrix = this.getMatrixForEntity(pid);
        const key = [pid];
        let attributeIndex = 1;
        for (const dimension of matrix.dimensions.values()) {
            let attributeId = dimensionIdToAttribute.get(dimension.id);
            if (attributeId === undefined) {
                attributeId = this.getDefaultAttribute(pid, attributeIndex);
            }
            const coordinate = this.getAttributeCoordinates(attributeId);
            key.push(coordinate.position);
            attributeIndex++;
        }
        return key.join(':');
    }

    getDefaultAttribute(id: PID, index: number): AID {
        // Lookup the generic entity in the catalog, using its PID.
        const genericItem: GenericTypedEntity = this.catalog.getGeneric(id);

        // Get the generic entity's defaultKey.
        const defaultKey: KEY = genericItem.defaultKey;

        return Number(defaultKey.split(':')[index]) as AID;
    }

    static hasDimension(matrix:Matrix, did: DID): boolean {
        for (const dimension of matrix.dimensions) {
            if (dimension.id === did) {
                return true;
            }
        }
        return false;
    }

    static pidFromKey(key: KEY) {
        const pid = Number.parseInt(key, 10);
        if (isNaN(pid)) {
            throw TypeError(`Bad key "${key}""`);
        }

        return pid;
    }
}
