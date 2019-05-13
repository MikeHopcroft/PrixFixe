import {
    PID,
    KEY,
} from '../catalog';

import {
    RuleConfig,
} from './interfaces';

// Given a child PID, is this child valid at the tensor coordinate?
export interface ValidChildPredicate {
    (child: KEY): boolean;
}

export interface ValidChildTensor {
    // NOTE: Weird how I can't use KEY type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: ValidChildPredicate;
}

// TODO: implement child tensor factory
export const childTensorFactory = (ruleSet: RuleConfig): ValidChildTensor => {
    return {};
};
