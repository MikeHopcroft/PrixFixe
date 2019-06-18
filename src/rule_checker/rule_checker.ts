import { CID, PID, Key, GenericTypedEntity } from '../catalog';

import {
    ValidChildTensor,
    ValidChildPredicate,
    childTensorFactory,
} from './child_tensor';

import {
    ExclusionTensor,
    MutualExclusionZone,
    mutualExclusionTensorFactory,
} from './exclusion_map';

import { RuleCheckerOps, RuleConfig, QuantityInformation } from './interfaces';
import { QuantityMap, QuantityTensor, quantityTensorFactory } from './quantity';

type Predicate = ValidChildPredicate | MutualExclusionZone | QuantityMap;
type Tensor = ValidChildTensor | ExclusionTensor | QuantityTensor;

export class RuleChecker implements RuleCheckerOps {
    private childTensor: ValidChildTensor;
    //private exceptionTensor: ExceptionTensor;
    private mutualTensor: ExclusionTensor;
    private quantityTensor: QuantityTensor;

    constructor(ruleSet: RuleConfig, genericMap: Map<PID, GenericTypedEntity>) {
        this.childTensor = childTensorFactory(ruleSet, genericMap);
        this.mutualTensor = mutualExclusionTensorFactory(ruleSet, genericMap);
        this.quantityTensor = quantityTensorFactory(ruleSet, genericMap);
    }

    private tensorWalker = (key: Key, tensor: Tensor): Predicate[] => {
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

    // See `RuleCheckerOps` for docs.
    isValidChild = (par: Key, child: Key): boolean => {
        const predicates = this.tensorWalker(
            par,
            this.childTensor
        ) as ValidChildPredicate[];

        // Evaulate each predicate and take the logical-or
        const result = predicates
            .map(predicate => predicate(child))
            .reduce((x, y): boolean => x || y, false);

        return result;
    };

    // Given the key of a parent item (parent) and the key of a child item
    // (child) return a curried function that indicates whether another child
    // (existing) would violate mutual exclusivity.
    //
    // The closure that is returned will return true if its parameter
    // (existingKey) could coexist (i.e. would not conflict) with the proposed
    // child.
    //
    // USE CASE: when adding an child item, one might want to detect and remove
    // items in the same exclusion zone. For example, suppose we have
    //
    //   grande latte
    //     soy milk
    //
    // and we want to add fat free milk. If soy milk and fat free milk were
    // in the same exclusion zone, we'd really like to replace soy milk with
    // fat free milk.
    //
    // Even if we didn't do this replacement automatically, we'd like the
    // ability to detect those children that would conflict, in order to apply
    // an appropriate policy.
    getPairwiseMutualExclusionPredicate(parent: Key, child: Key) {
        const predicates = this.tensorWalker(
            parent,
            this.mutualTensor
        ) as MutualExclusionZone[];

        const exclusionCIDs = new Set<CID>();
        const childPID = child.split(':')[0];
        for (const predicate of predicates) {
            const childCID = predicate(childPID);
            if (childCID > -1) {
                exclusionCIDs.add(childCID);
            }
        }

        return (existing: Key): boolean => {
            if (existing === child) {
                return false;
            }

            const existingPID = existing.split(':')[0];
            for (const predicate of predicates) {
                const existingCID = predicate(existingPID);
                if (existingCID > -1) {
                    if (exclusionCIDs.has(existingCID)) {
                        return false;
                    }
                }
            }
            return true;
        };
    }

    // Returns a closure the helps check whether a set of child Keys violate
    // mutual exclusivity constraints when added to a parent.
    //
    // The closure that is returned maintains a set of all child Keys passed
    // that did not collectively violate mutual exclusivity. Returns true if
    // the most recently passed Key does not violate mutual exclusivity.
    // Otherwise returns false. Keys that violate mutual exclusivity are not
    // added to the set of valid child keys.
    //
    // USE CASE: filtering a sequence of child keys to arrive at a sequence
    // that does not violate mutual exclusivity.
    getIncrementalMutualExclusionPredicate(parent: Key) {
        const predicates = this.tensorWalker(
            parent,
            this.mutualTensor
        ) as MutualExclusionZone[];

        const exclusionCIDs = new Set<CID>();
        const children = new Set<Key>();

        return (child: Key): boolean => {
            if (children.has(child)) {
                return false;
            }

            children.add(child);

            const childPID = child.split(':')[0];
            for (const predicate of predicates) {
                const childCID = predicate(childPID);
                if (childCID > -1) {
                    if (exclusionCIDs.has(childCID)) {
                        return false;
                    } else {
                        exclusionCIDs.add(childCID);
                    }
                }
            }
            return true;
        };
    }

    private getQuanitityInfo = (
        par: Key,
        child: Key
    ): QuantityInformation | undefined => {
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
    };

    // See `RuleCheckerOps` for docs.
    getDefaultQuantity = (par: Key, child: Key): number => {
        const quantityInfo = this.getQuanitityInfo(par, child);

        if (quantityInfo) {
            return quantityInfo.defaultQty;
        }

        return -1;
    };

    // See `RuleCheckerOps` for docs.
    isValidQuantity = (par: Key, child: Key, qty: number): boolean => {
        const quantityInfo = this.getQuanitityInfo(par, child);

        if (quantityInfo) {
            const result =
                qty >= quantityInfo.minQty && qty <= quantityInfo.maxQty;

            return result;
        }

        return false;
    };
}
