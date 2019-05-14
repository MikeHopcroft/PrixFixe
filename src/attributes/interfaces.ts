import { PID } from '../catalog';

import { IndexableItem } from '../../../ShortOrder/build/src/catalog/interfaces';

export interface AttributeItem extends IndexableItem {
    pid: PID;
    name: string;
    aliases: string[];
    hidden?: boolean;
    isDefault?: boolean;
    sku?: PID;
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
