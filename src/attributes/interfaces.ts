import { DID } from '../attributes';
import { MID, PID } from '../catalog';

/**
 * Unique attribute identifier. Attributes are SKU-specifying modifiers that
 * combine with a generic product to form a specific product.
 */
export type AID = number;

export interface AttributeItem {
    aid: AID;
    name: string;
    aliases: string[];
    hidden?: boolean;
}

export interface DimensionDescription {
    did: DID;
    name: string;
    items: AttributeItem[];
}

export interface MatrixDescription {
    mid: MID;
    name: string;
    dimensions: DID[];
}

export interface Attributes {
    dimensions: DimensionDescription[];
    matrices: MatrixDescription[];
}
