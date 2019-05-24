import { Dimension } from './dimension';

export type MID = number;

// Represents a configuration matrix consisting of a set of Dimensions
// each of which corresponds to a set of Attributes.
// Used to generate entity keys.
export interface Matrix {
    readonly mid: MID;
    readonly dimensions: Dimension[];
}
