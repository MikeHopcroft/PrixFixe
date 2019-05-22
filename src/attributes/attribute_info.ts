import { AID } from '../attributes';
import { Catalog, PID } from '../catalog';

import { Dimension } from './dimension';
import { Attributes } from './interfaces';
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
    private readonly dimensionIdToDimension = new Map<PID, Dimension>();
    private readonly attributeIdToCoordinate = new Map<
        PID,
        AttributeCoordinate
    >();
    private readonly matrixIdToMatrix = new Map<PID, Matrix>();
    private readonly entityIdToMatrix = new Map<PID, Matrix>();

    static factory(catalog: Catalog, attributes: Attributes): AttributeInfo {
        const info = new AttributeInfo();

        for (const dimension of attributes.dimensions) {
            info.addDimension(
                new Dimension(dimension.did, dimension.items.values())
            );
        }

        for (const matrix of attributes.matrices) {
            // TODO: check for bad/unknown `did`.
            const dimensions: Dimension[] = [];
            for (const did of matrix.dimensions) {
                const dimension = info.dimensionIdToDimension.get(did);
                if (!dimension) {
                    const message = `unknown dimension ${did}.`;
                    throw TypeError(message);
                }
                dimensions.push(dimension);
            }
            info.addMatrix(new Matrix(matrix.mid, dimensions, catalog));
        }

        for (const item of catalog.mapGeneric.values()) {
            if (item.matrix) {
                info.addGenericEntity(item.pid, item.matrix);
            }
        }

        return info;
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
        if (this.matrixIdToMatrix.has(matrix.id)) {
            const message = `found duplicate matrix id ${matrix.id}.`;
            throw new TypeError(message);
        }
        this.matrixIdToMatrix.set(matrix.id, matrix);
    }

    // Associates a genericEntity's PID with a matrix.
    private addGenericEntity(pid: PID, matrixId: PID) {
        if (this.entityIdToMatrix.has(pid)) {
            const message = `found duplicate entity id ${pid}.`;
            throw new TypeError(message);
        }
        const matrix = this.matrixIdToMatrix.get(matrixId);
        if (matrix) {
            this.entityIdToMatrix.set(pid, matrix);
        } else {
            const message = `unknown matrix id ${matrixId}.`;
            throw new TypeError(message);
        }
    }

    // Lookup an AttributeCoordinate by AID. The Coordinate provides the
    // Attribute's Dimension (e.g. size) and its Position in the Dimension
    // (e.g. 0 ==> small).
    getAttributeCoordinates(aid: AID): AttributeCoordinate | undefined {
        return this.attributeIdToCoordinate.get(aid);
    }

    // Returns a GenericEntity's Matrix.
    getMatrixForEntity(pid: PID): Matrix {
        const matrix = this.entityIdToMatrix.get(pid);
        if (matrix === undefined) {
            throw TypeError(`GenericEntity(pid=${pid}) has no matrix.`);
        }
        return matrix;
    }
}
