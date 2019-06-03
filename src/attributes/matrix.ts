import { TID } from '../catalog';

import { Dimension } from './dimension';

/**
 * Represents a configuration tensor consisting of a set of Dimensions each of
 * which corresponds to a set of Attributes. Used to generate entity keys.
 */
export interface Matrix {
    readonly tid: TID;
    readonly dimensions: Dimension[];
}
