import { DID } from '../attributes';
import { Catalog, KEY, TID, PID } from '../catalog';

import { Dimension } from './dimension';
import { AID, DimensionAndTensorDescription } from './interfaces';
import { Tensor } from './tensor';

/**
 * The (dimension, position) coordinates of an attribute within a Tensor.
 * Dimension corresponds to a characteristic like `size`. Position corresponds
 * to a specific characteristic value such as `small`, `medium`, or `large`.
 */
export interface AttributeCoordinate {
    dimension: Dimension;
    position: number;
}

/**
 * Store information about the relationships between DimensionAndTensorDescription, Dimensions,
 * and Tensors.
 */
export class AttributeInfo {
    private readonly catalog: Catalog;
    private readonly dimensionIdToDimension = new Map<DID, Dimension>();
    private readonly attributeIdToCoordinate = new Map<
        AID,
        AttributeCoordinate
    >();
    private readonly tensorIdToTensor = new Map<TID, Tensor>();

    constructor(catalog: Catalog, attributes: DimensionAndTensorDescription) {
        this.catalog = catalog;

        for (const dimension of attributes.dimensions) {
            this.addDimension(
                new Dimension(
                    dimension.did,
                    dimension.name,
                    dimension.attributes.values()
                )
            );
        }

        for (const tensor of attributes.tensors) {
            // TODO: check for bad/unknown `did`.
            const dimensions: Dimension[] = [];
            for (const did of tensor.dimensions) {
                const dimension = this.dimensionIdToDimension.get(did);
                if (!dimension) {
                    const message = `unknown dimension id ${did}.`;
                    throw TypeError(message);
                }
                dimensions.push(dimension);
            }
            this.addTensor({ tid: tensor.tid, dimensions });
        }
    }

    /**
     * Indexes a Dimension and its Attributes.
     */
    private addDimension(dimension: Dimension) {
        if (this.dimensionIdToDimension.has(dimension.did)) {
            const message = `found duplicate dimension id ${dimension.did}.`;
            throw new TypeError(message);
        }
        this.dimensionIdToDimension.set(dimension.did, dimension);

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

    getDimension(did: DID) {
        const dimension = this.dimensionIdToDimension.get(did);
        if (dimension === undefined) {
            const message = `Unknown dimension id ${did}.`;
            throw TypeError(message);
        }
        return dimension;
    }

    /**
     * Indexes a Tensor.
     */
    private addTensor(tensor: Tensor) {
        if (this.tensorIdToTensor.has(tensor.tid)) {
            const message = `found duplicate tensor id ${tensor.tid}.`;
            throw new TypeError(message);
        }
        this.tensorIdToTensor.set(tensor.tid, tensor);
    }

    /**
     * Look up an AttributeCoordinate by AID. The Coordinate provides the
     * Attribute's Dimension (e.g. `size`) and its Position in the Dimension
     * (e.g. `0 ==> small`).
     */
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
    // Tensor-related methods
    //
    ///////////////////////////////////////////////////////////////////////////

    getTensor(tid: TID) {
        const tensor = this.tensorIdToTensor.get(tid);
        if (tensor === undefined) {
            const message = `Bad tensor id ${tid}.`;
            throw message;
        }
        return tensor;
    }

    /**
     * Returns a GenericEntity's Tensor.
     */
    getTensorForEntity(pid: PID): Tensor {
        const genericEntity = this.catalog.getGeneric(pid);
        return this.getTensor(genericEntity.tensor);
    }

    /**
     * Given a GenericEntity's PID and a map from DID to AID, return a number
     * that represents those set of attribute values associated with Dimensions
     * of the GenericEntity's Tensor.
     */
    getKey(pid: PID, dimensionIdToAttribute: Map<DID, AID>): string {
        // Get the genericEntity for its tensor and defaultKey.
        const genericEntity = this.catalog.getGeneric(pid);
        const tensor = this.getTensor(genericEntity.tensor);

        // Convert the default key into a sequence of coordinate fields.
        const key = genericEntity.defaultKey;
        const fields = key.split(':').map(parseBase10Int);
        fields.shift();

        // Overwrite default coordinate fields with values supplied from the
        // map.
        for (const [index, dimension] of tensor.dimensions.entries()) {
            const aid = dimensionIdToAttribute.get(dimension.did);
            if (aid !== undefined) {
                const coordinate = this.getAttributeCoordinates(aid);
                fields[index] = coordinate.position;
            }
        }

        // Build and return the key string.
        return [pid, ...fields].join(':');
    }

    getAttributes(key: KEY): AID[] {
        const fields = key.split(':').map(parseBase10Int);
        const pid = fields[0];
        const tensor = this.getTensorForEntity(pid);

        fields.shift();
        const aids: AID[] = [];
        for (let i = 0; i < fields.length; ++i) {
            const dimension = tensor.dimensions[i];
            const attribute = dimension.attributes[fields[i]];
            aids.push(attribute.aid);
        }

        return aids;
    }

    static hasDimension(tensor: Tensor, did: DID): boolean {
        for (const dimension of tensor.dimensions) {
            if (dimension.did === did) {
                return true;
            }
        }
        return false;
    }

    static pidFromKey(key: KEY): PID {
        const pid = Number.parseInt(key, 10);
        if (isNaN(pid)) {
            throw TypeError(`Bad key "${key}""`);
        }

        return pid;
    }
}

function parseBase10Int(text: string): number {
    const n = Number.parseInt(text, 10);
    if (isNaN(n)) {
        const message = `Invalid number ${text}.`;
    }
    return n;
}
