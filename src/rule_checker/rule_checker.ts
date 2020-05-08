import { AttributeInfo } from '../attributes';
import { CID, PID, Key, GenericTypedEntity } from '../catalog';

import {
    ValidChildren,
    validChildrenFactory,
    ValidChildTensor,
    ValidChildPredicate,
    childTensorFactory,
} from './child_tensor';

import {
    ExclusionTensor,
    MutualExclusionZone,
    mutualExclusionTensorFactory,
} from './exclusion_map';

import { IRuleChecker, RuleConfig, QuantityInformation } from './interfaces';
import { QuantityMap, QuantityTensor, quantityTensorFactory } from './quantity';
import { Type } from 'js-yaml';

type Predicate = ValidChildPredicate | MutualExclusionZone | QuantityMap;
type Tensor = ValidChildTensor | ExclusionTensor | QuantityTensor;

export class RuleChecker implements IRuleChecker {
    private childTensor: ValidChildTensor;
    private validChildren: ValidChildren;
    //private exceptionTensor: ExceptionTensor;
    private mutualTensor: ExclusionTensor;
    private quantityTensor: QuantityTensor;

    constructor(ruleSet: RuleConfig, genericMap: Map<PID, GenericTypedEntity>) {
        this.childTensor = childTensorFactory(ruleSet, genericMap);
        this.validChildren = validChildrenFactory(ruleSet, genericMap);
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

    // See `IRuleChecker` for docs.
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

    // TODO: reduce code and concept overlap between getValidChildren() and
    // tensorWalker().
    // TODO: change implementation of isValidChild to use this.validChildren.
    getValidChildren(key: Key): Set<PID> {
        const result = new Set<PID>();

        const dimensions = key.split(':');
        let nextSection: string | undefined = dimensions.shift();
        let partialKey = nextSection;

        while (nextSection) {
            const pids = this.validChildren.get(partialKey!);
            if (pids !== undefined) {
                for (const pid of pids) {
                    result.add(pid);
                }
            }

            nextSection = dimensions.shift();
            partialKey = `${partialKey}:${nextSection}`;
        }

        return result;
    }

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
    getPairwiseMutualExclusionPredicate(
        parent: Key,
        child: Key
    ): (existing: string) => boolean {
        const predicates = this.tensorWalker(
            parent,
            this.mutualTensor
        ) as MutualExclusionZone[];

        const exclusionCIDs = new Set<CID>();
        const childPID = AttributeInfo.pidFromKey(child).toString();
        for (const predicate of predicates) {
            const childCID = predicate(childPID);
            if (childCID > -1) {
                exclusionCIDs.add(childCID);
            }
        }

        return (existing: Key): boolean => {
            const existingPID = AttributeInfo.pidFromKey(existing).toString();
            if (existingPID === childPID) {
                return false;
            }

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
    getIncrementalMutualExclusionPredicate(
        parent: Key
    ): (existing: string) => boolean {
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

            const childPID = AttributeInfo.pidFromKey(child).toString();
            const thisChildCIDs = new Set<CID>();
            for (const predicate of predicates) {
                const childCID = predicate(childPID);
                if (childCID > -1) {
                    if (exclusionCIDs.has(childCID)) {
                        return false;
                    } else {
                        thisChildCIDs.add(childCID);
                    }
                }
            }

            // DESIGN NOTE: in the case where a parent has multiple
            // MutualExclusionZone predicates, it is possible that two or more
            // predicates could return the same CID. This would result in a
            // return value of false, even if the child were legal.
            //
            // What would happen is that the first iteration through the
            // predicates loop for a given CID would succeed because the CID
            // would not be in exclusionCIDs. A later iteration for the same
            // CID would fail because the CID would now be in exclusionCIDs.
            //
            // The fix is to save the current child's CIDs until after the
            // predicates loop, and only then merge these CIDs into exclusionCIDs.
            for (const cid of thisChildCIDs.values()) {
                exclusionCIDs.add(cid);
            }

            return true;
        };
    }

    private getQuanitityInfo = (
        par: Key,
        child: Key
    ): QuantityInformation | undefined => {
        // First, check if theres a fully qualified key with a wildcard
        const fullyQualifiedKeyMap = this.quantityTensor[par];

        if (fullyQualifiedKeyMap) {
            const specificQuantityRule = fullyQualifiedKeyMap(child, '');

            if (specificQuantityRule) {
                return specificQuantityRule;
            }
        }

        const upstreamAtts = par.split(':');
        const downstreamAtts = par.split(':').reverse();

        // Search through partial keys
        for (let i = downstreamAtts.length - 1; i > 0; i--) {
            // Partition key by taking off the last coordinate and using that
            // to search for rules that apply to downstream keys
            const partialKey = upstreamAtts.slice(0, i).join(':');
            const downstream = downstreamAtts.shift();

            // Get config map for parent's partialKey
            const map = this.quantityTensor[partialKey];

            if (map) {
                // Check if the config map has a rule for the current partition
                if (map(child, downstream!)) {
                    return map(child, downstream!);
                } else if (map(child, '')) {
                    // ...else if there's a wildcard rule in the config map
                    return map(child, '');
                }
            }
        }

        return undefined;
    };

    // See `IRuleChecker` for docs.
    getDefaultQuantity = (par: Key, child: Key): number => {
        const quantityInfo = this.getQuanitityInfo(par, child);

        if (quantityInfo) {
            return quantityInfo.defaultQty;
        }

        return -1;
    };

    // See `IRuleChecker` for docs.
    isValidQuantity = (par: Key, child: Key, qty: number): boolean => {
        const quantityInfo = this.getQuanitityInfo(par, child);

        if (quantityInfo) {
            const result =
                qty >= quantityInfo.minQty && qty <= quantityInfo.maxQty;

            return result;
        }

        return false;
    };

    
    getExclusionGroups(pid: PID): Array<Set<PID>> {
        // NOTE: this feature is not implemented for RuleChecker.
        return [];
    }
}
