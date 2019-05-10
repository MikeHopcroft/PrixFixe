import { } from './interfaces';

import {
    PID,
    KEY,
} from '../catalog';

// TODO: make this into a class.
export interface RuleChecker {
    // Check is an item is a valid child for another item
    // Uses a ValidChildTensor to build a set of predicates, which must
    //   evaluate to true over their intersection.
    //
    // Use case: Can an ingredient be added to a standalone item?
    isValidChild(parent: KEY, child: PID): boolean;

    // Check if two modifiers are in a mutually exclusive set
    //
    // Use case: If a pizza has red sauce as a child item, then I want to know
    //   if it can also have white sauce as a child item.
    //
    // Issue: should items be mutally exclusive with themselves?
    isMutuallyExclusive(modOne: PID, modTwo: PID): boolean;
}
