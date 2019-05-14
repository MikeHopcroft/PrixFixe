import {
    KEY,
    PID,
} from '../catalog';

import {
    RuleConfig,
} from './interfaces';

// Given a two modifiers, are they mutually exlusive with each other?
export interface MutualExclusionPredicate {
    (modOne: KEY, modTwo: KEY): boolean;
}

export interface ExclusionTensor {
    // NOTE: Weird how I can't use KEY type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: MutualExclusionPredicate;
}

// TODO: implement exclusion set map factory
export const mutualExclusionTensorFactory = (
    ruleSet: RuleConfig
): ExclusionTensor => {
    return {};
};

