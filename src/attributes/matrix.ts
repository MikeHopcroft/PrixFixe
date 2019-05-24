import { Catalog, DID, GenericTypedEntity, KEY, MID, PID } from '../catalog';

import { AttributeInfo } from './attribute_info';
import { Dimension } from './dimension';
import { AID } from './interfaces';

// Represents a configuration matrix consisting of a set of Dimensions
// each of which corresponds to a set of Attributes.
// Used to generate entity keys.
export class Matrix {
    readonly id: MID;
    readonly dimensions: Dimension[];

    constructor(id: MID, dimensions: Dimension[]) {
        this.id = id;
        this.dimensions = dimensions;
    }
}
