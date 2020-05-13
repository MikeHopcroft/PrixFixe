import { AttributeInfo } from '../attributes';
import { PID } from '../catalog';
import { IRuleChecker } from '../rule_checker';

import { AnyRule, Key } from './types';

export function processRules(
    tagsToPIDs: Map<string, PID[]>,
    rules: AnyRule[]
): IRuleChecker {
    const ruleChecker = new RuleChecker2();

    for (const rule of rules) {
        if ('children' in rule) {
            processParentChild(
                ruleChecker,
                tagsToPIDs,
                rule.parents,
                rule.children
            );
        } else {
            processExclusions(
                ruleChecker,
                tagsToPIDs,
                rule.parents,
                rule.exclusive
            );
        }
    }

    return ruleChecker;
}

function processParentChild(
    rules: RuleChecker2,
    tagsToPIDs: Map<string, PID[]>,
    parentTags: string[],
    childrenTags: string[]
) {
    const parents = new Set<PID>();
    for (const tag of parentTags) {
        const pList = tagsToPIDs.get(tag) || [];
        for (const p of pList) {
            parents.add(p);
        }
    }

    const children = new Set<PID>();
    for (const tag of childrenTags) {
        const cList = tagsToPIDs.get(tag) || [];
        for (const c of cList) {
            children.add(c);
        }
    }

    for (const p of parents) {
        for (const c of children) {
            rules.addChild(p, c);
        }
    }
}

function processExclusions(
    rules: RuleChecker2,
    tagsToPIDs: Map<string, PID[]>,
    parentTags: string[],
    exclusiveTags: string[]
) {
    const parents = new Set<PID>();
    for (const tag of parentTags) {
        const pList = tagsToPIDs.get(tag) || [];
        for (const p of pList) {
            parents.add(p);
        }
    }

    // TODO: REVIEW semantics - do we want to create one exclusion set per tag
    // or one combined exclusion set?
    const exclusionSets: Array<Set<PID>> = [];
    for (const tag of exclusiveTags) {
        const cList = tagsToPIDs.get(tag) || [];
        const exclusions = new Set<PID>();
        for (const c of cList) {
            exclusions.add(c);
        }
        exclusionSets.push(exclusions);
    }

    for (const p of parents) {
        for (const e of exclusionSets) {
            rules.addExclusionSet(p, e);
        }
    }
}

class RuleChecker2 implements IRuleChecker {
    private readonly emptySet = new Set<PID>();
    private readonly validChildren = new Map<PID, Set<PID>>();
    private readonly exclusion = new Map<PID, Array<Set<PID>>>();

    constructor() {}

    addChild(parent: PID, child: PID) {
        // console.log(`rules.addChild(${parent}, ${child})`);
        const children = this.validChildren.get(parent);
        if (children) {
            children.add(child);
        } else {
            this.validChildren.set(parent, new Set([child]));
        }
    }

    addExclusionSet(parent: PID, exclusionSet: Set<PID>) {
        // console.log(`rules.addExclusionSet(${parent}, [${[...exclusionSet.values()].join(',')}])`);
        const exclusions = this.exclusion.get(parent);
        if (exclusions) {
            exclusions.push(exclusionSet);
        } else {
            this.exclusion.set(parent, [exclusionSet]);
        }
    }

    isValidChild(parent: Key, child: Key): boolean {
        const pPID = AttributeInfo.pidFromKey(parent);
        const cPID = AttributeInfo.pidFromKey(child);

        const children = this.validChildren.get(pPID);
        if (children) {
            return children.has(cPID);
        }
        return false;
    }

    getValidChildren(parent: string): Set<number> {
        const pPID = AttributeInfo.pidFromKey(parent);
        const children = this.validChildren.get(pPID);
        if (children) {
            return children;
        }
        return this.emptySet;
    }

    getPairwiseMutualExclusionPredicate(
        parent: string,
        child: string
    ): (existing: string) => boolean {
        const pPID = AttributeInfo.pidFromKey(parent);
        const children = new Set<PID>();

        // Exclusion sets associated with the parrent.
        const allExclusionSets = this.exclusion.get(pPID);

        if (allExclusionSets === undefined) {
            return (existing: string) => true;
        }

        const cPID = AttributeInfo.pidFromKey(child);

        return (existing: string) => {
            const ePID = AttributeInfo.pidFromKey(existing);
            for (const es of allExclusionSets) {
                if (es.has(cPID) && es.has(ePID)) {
                    return false;
                }
            }
            return true;
        };
    }

    getIncrementalMutualExclusionPredicate(
        parent: string
    ): (existing: string) => boolean {
        const pPID = AttributeInfo.pidFromKey(parent);
        const children = new Set<PID>();

        // Exclusion sets associated with the parrent.
        const allExclusionSets = this.exclusion.get(pPID);

        // Subset of allExclusionSets that contain one of the children.
        const activeExclusionSets = new Set<Set<PID>>();

        return (child: Key): boolean => {
            if (!allExclusionSets) {
                // This parent has no mutual exclusion rules for its children.
                return true;
            }

            const cPID = AttributeInfo.pidFromKey(child);
            if (children.has(cPID)) {
                // There is already a child with this PID, so adding another
                // violates mutual-exclusivity with respect to attributes.
                return false;
            }

            const newExclusionSets: Array<Set<PID>> = [];
            for (const es of allExclusionSets) {
                if (activeExclusionSets.has(es)) {
                    // New child conflicts with an existing child.
                    return !es.has(cPID);
                } else if (es.has(cPID)) {
                    // No conflict. Save exclusion set for later.
                    newExclusionSets.push(es);
                }
            }

            // This child doesn't conflict with an existing child.
            // Add to children and update activeExclusionSets.
            children.add(cPID);
            for (const s of newExclusionSets) {
                activeExclusionSets.add(s);
            }

            return true;
        };
    }

    getDefaultQuantity(parent: string, child: string): number {
        throw new Error('Method not implemented.');
    }

    isValidQuantity(parent: string, child: string, qty: number): boolean {
        throw new Error('Method not implemented.');
    }

    getExclusionGroups(pid: PID): Array<Set<PID>> {
        const groups = this.exclusion.get(pid);
        return groups || [];
    }
}
