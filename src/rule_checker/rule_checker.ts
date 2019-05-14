import {
    PID,
    KEY,
} from '../catalog';

import {
    RuleCheckerOps,
    RuleConfig,
    QuantityInformation,
} from './interfaces';

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
    QuantityTensor,
    quantityTensorFactory,
} from './quantity';

export class RuleChecker implements RuleCheckerOps {
    // TODO: constructor will utilize various tensor factories
    constructor (ruleSet: RuleConfig) {

    }

    // See `RuleCheckerOps for docs
    isValidChild = (parent: KEY, child: KEY): boolean => {
        // TODO: implement me
        return false;
    }

    // See `RuleCheckerOps for docs
    isMutuallyExclusive = (parent:KEY, modSet: IterableIterator<KEY>): boolean => {
        // TODO: implement me
        return false;
    }

    // See `RuleCheckerOps for docs
    getDefaultQuantity = (parent: KEY, child: KEY): number => {
        // TODO: implement me
        return -1;
    }

    // See `RuleCheckerOps for docs
    isValidQuantity = (parent: KEY, child: KEY, qty: number): boolean => {
        // TODO: implement me
        return false;
    }
}
