import { PID } from '../catalog';

// Unique attribute identifier. Attributes are SKU-specifying modifiers that
// combine with a generic product to form a specific product.
export type AID = number;

export interface AttributeItem {
    pid: AID;
    name: string;
    aliases: string[];
    hidden?: boolean;
    isDefault?: boolean;
}

export interface DimensionDescription {
    did: PID;
    name: string;
    items: AttributeItem[];
}

export interface MatrixDescription {
    mid: PID;
    name: string;
    dimensions: PID[];
}

export interface Attributes {
    dimensions: DimensionDescription[];
    matrices: MatrixDescription[];
}
