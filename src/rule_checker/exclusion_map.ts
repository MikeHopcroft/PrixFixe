import {
    PID,
} from '../catalog';

import {
    RuleConfig,
} from './interfaces';

// Given a two modifiers, are they mutually exlusive with each other?
export interface MutualExclusionPredicate {
    (modOne: PID, modTwo: PID): boolean;
}

// Since exclusion is symmetric, map will lexigraphically sort PIDs into a
//   `PID:PID` key to fetch a predicate.
export interface ExclusionSetMap {
    // NOTE: Weird how I can't use KEY type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: MutualExclusionPredicate;
}

// TODO: implement exclusion set map factory
export const mutualExclusionSetMapFactory = (
    ruleSet: RuleConfig
): ExclusionSetMap => {
    return {};
};

