import { CID, PID, KEY, GenericTypedEntity } from '../catalog';

import { RuleCheckerOps, RuleConfig, QuantityInformation } from './interfaces';

import {
    ValidChildTensor,
    ValidChildPredicate,
    childTensorFactory
} from './child_tensor';

import {
    ExclusionTensor,
    MutualExclusionZone,
    mutualExclusionTensorFactory
} from './exclusion_map';

import { QuantityMap, QuantityTensor, quantityTensorFactory } from './quantity';

type Predicate = ValidChildPredicate | MutualExclusionZone | QuantityMap;
type Tensor = ValidChildTensor | ExclusionTensor | QuantityTensor;

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


    private tensorWalker = (key: KEY, tensor: Tensor): Predicate[] => {
        const predicates: Predicate[] = [];
        const dimensions = key.split(':');

        let nextSection: string | undefined = dimensions.shift();
        let partialKey = nextSection;

        // Aggrecate all predicates for each partial key, where each
        //   partial key has its complete prefix
        while (nextSection) {
            const predicate = tensor[partialKey!];

            if (predicate) {
                predicates.push(predicate);
            }

            nextSection = dimensions.shift();
            partialKey = `${partialKey}:${nextSection}`;
        }

        return predicates;
    };

    // See `RuleCheckerOps for docs
    // TODO: Add specificExceptions checking
    isValidChild = (par: KEY, child: KEY): boolean => {
        const predicates = this.tensorWalker(
            par,
            this.childTensor
        ) as ValidChildPredicate[];

        // Evaulate each predicate and take the logical-or
        const result = predicates
            .map(predicate => predicate(child))
            .reduce((x, y): boolean =>  x || y);

        return result;
    };

    // See `RuleCheckerOps for docs
    isMutuallyExclusive = (
        par: KEY,
        modSet: IterableIterator<KEY>
    ): boolean => {
        const predicates = this.tensorWalker(
            par,
            this.mutualTensor
        ) as MutualExclusionZone[];

        const exSet = new Set<CID>();

        for (const mod of modSet) {
            for (const predicate of predicates) {
                const modPID = mod.split(':')[0];
                const cid = predicate(modPID);

                // If the mod belongs to an exclusion category
                if (cid > -1) {
                    // Add any zone that doesn't exist yet
                    if (!exSet.has(cid)) {
                        exSet.add(cid);
                    // If we've seen a zone before, then the set is exclusive
                    } else {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    private getQuanitityInfo = (
        par: KEY,
        child: KEY
    ): (QuantityInformation | undefined) => {
        const upstreamAtts = par.split(':');
        const downstreamAtts = par.split(':').reverse();

        for (let i = downstreamAtts.length - 1; i > 0; i--) {
            const partialKey = upstreamAtts.slice(0, i).join(':');
            const downstream = downstreamAtts.shift();

            const map = this.quantityTensor[partialKey];

            if (map) {
                if (map(child, downstream!)) {
                    return map(child, downstream!);

                } else if (map(child, '')) {
                    return map(child, '');
                }
            }
        }

        return undefined;
    }

    // See `RuleCheckerOps for docs
    getDefaultQuantity = (par: KEY, child: KEY): number => {
        const quantityInfo = this.getQuanitityInfo(par, child);

        if (quantityInfo) {
            return quantityInfo.defaultQty;
        }

        return -1;
    };

    // See `RuleCheckerOps for docs
    isValidQuantity = (par: KEY, child: KEY, qty: number): boolean => {
        const quantityInfo = this.getQuanitityInfo(par, child);

        if (quantityInfo) {
            const result = qty >= quantityInfo.minQty
                        && qty <= quantityInfo.maxQty;

            return result;
        }

        return false;
    };
}
