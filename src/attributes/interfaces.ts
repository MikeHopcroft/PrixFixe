import { DID } from '../attributes';
import { TID, PID } from '../catalog';

/**
 * Unique attribute identifier. Attributes are SKU-specifying modifiers that
 * combine with a generic product to form a specific product.
 */
export type AID = number;

export interface AttributeDescription {
    aid: AID;
    name: string;
    aliases: string[];
    hidden?: boolean;
}

export interface DimensionDescription {
    did: DID;
    name: string;
    attributes: AttributeDescription[];
}

export interface TensorDescription {
    tid: TID;
    name: string;
    dimensions: DID[];
}

export interface DimensionAndTensorDescription {
    dimensions: DimensionDescription[];
    tensors: TensorDescription[];
}
