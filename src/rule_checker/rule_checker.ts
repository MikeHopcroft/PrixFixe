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
    ExclusionTensor,
    MutualExclusionPredicate,
    mutualExclusionTensorFactory,
} from './exclusion_map';

import {
    QuantityInformation,
    QuantityTensor,
    quantityTensorFactory,
} from './quantity';

// TODO: make this into a class.
// TODO: constructor will utilize various tensor factories
export interface RuleChecker {
    // Check is an item is a valid child for another item
    // Uses a ValidChildTensor to build a set of predicates, which must
    //   evaluate to true over their intersection.
    //
    // Use case: Can an ingredient be added to a standalone item?
    isValidChild(parent: KEY, child: KEY): boolean;

    // Check if two modifiers are in a mutually exclusive set
    //
    // Use case: If a pizza has red sauce as a child item, then I want to know
    //   if it can also have white sauce as a child item.
    //
    // Issue: should items be mutally exclusive with themselves?
    isMutuallyExclusive(parent:KEY, modOne: KEY, modTwo: KEY): boolean;

    // Gets the default quantity of a child attached to a parent
    //
    // Use case: When I add ketchup packets to a burger, I want to know whether
    //   I should add one or two.
    getDefaultQuantity(parent: KEY, child: KEY): number;

    // Predicate to validate that a quantity is within a threshold
    //
    // Use case: If a drink comes with lemons, then I may want to limit the
    //   number of lemons allowed in the drink to 5. If I pass this function
    //   6 - with drink as parent and lemons as child, then return false.
    isValidQuantity(parent: KEY, child: KEY, qty: number): number;
}
