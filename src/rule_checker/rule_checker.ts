import {
    PID,
    KEY,
} from '../catalog';

//import { } from './interfaces';

import {
    ValidChildTensor,
    ValidChildPredicate,
    childTensorFactory,
} from './child_tensor';

import {
    ExclusionSetMap,
    MutualExclusionPredicate,
    mutualExclusionSetMapFactory,
} from './exclusion_map';

// TODO: make this into a class.
// TODO: constructor will utilize various tensor factories
export interface RuleChecker {
    // Check is an item is a valid child for another item
    // Uses a ValidChildTensor to build a set of predicates, which must
    //   evaluate to true over their intersection.
    //
    // Use case: Can an ingredient be added to a standalone item?
    // Issue: should the child's PID be a KEY? For instance, a packet of
    //   ketchup may go with a to-go item when a cup of ketchup may not.
    //   However, a packet of ketchup and a cup of ketchup may have the same
    //   PID and different keys.
    isValidChild(parent: KEY, child: PID): boolean;

    // Check if two modifiers are in a mutually exclusive set
    //
    // Use case: If a pizza has red sauce as a child item, then I want to know
    //   if it can also have white sauce as a child item.
    //
    // Issue: should items be mutally exclusive with themselves?
    isMutuallyExclusive(modOne: PID, modTwo: PID): boolean;
}
