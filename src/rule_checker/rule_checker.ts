import { PID, KEY, GenericTypedEntity } from '../catalog';

import { RuleCheckerOps, RuleConfig, QuantityInformation } from './interfaces';

import {
    ValidChildTensor,
    ValidChildPredicate,
    childTensorFactory
} from './child_tensor';

import {
    ExclusionTensor,
    MutualExclusionPredicate,
    mutualExclusionTensorFactory
} from './exclusion_map';

import { QuantityTensor, quantityTensorFactory } from './quantity';

export class RuleChecker implements RuleCheckerOps {
    private childTensor: ValidChildTensor;
    // TODO: implement ExceptionTensor
    //private exceptionTensor: ExceptionTensor;
    private mutualTensor: ExclusionTensor;
    private quantityTensor: QuantityTensor;

    // TODO: constructor will utilize various tensor factories
    constructor(ruleSet: RuleConfig, genericMap: Map<PID, GenericTypedEntity>) {
        this.childTensor = childTensorFactory(ruleSet, genericMap);
        this.mutualTensor = mutualExclusionTensorFactory(ruleSet, genericMap);
        this.quantityTensor = quantityTensorFactory(ruleSet, genericMap);
    }

    // See `RuleCheckerOps for docs
    // TODO: Add specificExceptions checking
    isValidChild = (par: KEY, child: KEY): boolean => {
        const predicates: ValidChildPredicate[] = [];
        const dimensions = par.split(':');

        let nextSection: string | undefined = dimensions.shift();
        let partialKey = nextSection;

        while (nextSection) {
            const predicate = this.childTensor[partialKey!];

            if (predicate) {
                predicates.push(predicate);
            }

            nextSection = dimensions.shift();
            partialKey = `${partialKey}:${nextSection}`;
        }

        const result = predicates
            .map(predicate => predicate(child))
            .reduce((x, y): boolean =>  x || y);

        return result;
    };

    // See `RuleCheckerOps for docs
    isMutuallyExclusive = (
        parent: KEY,
        modSet: IterableIterator<KEY>
    ): boolean => {
        // TODO: implement me
        return false;
    };

    // See `RuleCheckerOps for docs
    getDefaultQuantity = (parent: KEY, child: KEY): number => {
        // TODO: implement me
        return -1;
    };

    // See `RuleCheckerOps for docs
    isValidQuantity = (parent: KEY, child: KEY, qty: number): boolean => {
        // TODO: implement me
        return false;
    };
}
