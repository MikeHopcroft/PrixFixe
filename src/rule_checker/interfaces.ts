import { CID, PID, Key } from '../catalog';

export interface QuantityInformation {
    defaultQty: number;
    maxQty: number;
    minQty: number;
}

export interface DownstreamQuantity {
    // Assumes that quantity information is relevant for the rest of the
    //   hierarchy. Use the empty string to match all downstream attributes.
    [partialKey: string]: QuantityInformation;
}

export interface CategoryInfo {
    validOptions: PID[];
    qtyInfo: DownstreamQuantity;
}

export interface CategoryMap {
    [cid: number]: CategoryInfo;
}

export interface ExclusionSet {
    [cid: number]: PID[];
}

export interface PartialRule {
    partialKey: Key;
    validCategoryMap: CategoryMap;
    exclusionZones: ExclusionSet;
    specificExceptions: Key[];
}

/**
 * The shape of the `rule.yaml` file.
 */
export interface RuleConfig {
    rules: PartialRule[];
}

// tslint:disable-next-line:interface-name
export interface IRuleChecker {
    /**
     * Check if an item is a valid child for another item. Uses a
     * ValidChildTensor to build a set of predicates, which must evaluate to
     * true over their intersection.
     *
     * @useCase Can an ingredient be added to a standalone item?
     */
    isValidChild(parent: Key, child: Key): boolean;

    getValidChildren(parent: Key): Set<PID>;

    /**
     * @deprecated Please use getIncrementalMutualExclusionPredicate
     *
     * Given the key of a parent item (parent) and the key of a child item
     * (child) return a curried function that indicates whether another child
     * (existing) would violate mutual exclusivity.
     *
     * The closure that is returned will return true if its parameter
     * (existingKey) could coexist (i.e. would not conflict) with the proposed
     * child.
     *
     * USE CASE: when adding an child item, one might want to detect and remove
     * items in the same exclusion zone. For example, suppose we have
     *
     *   grande latte
     *     soy milk
     *
     * and we want to add fat free milk. If soy milk and fat free milk were
     * in the same exclusion zone, we'd really like to replace soy milk with
     * fat free milk.
     *
     * Even if we didn't do this replacement automatically, we'd like the
     * ability to detect those children that would conflict, in order to apply
     * an appropriate policy.
     */
    getPairwiseMutualExclusionPredicate(
        parent: Key,
        child: Key
    ): (existing: string) => boolean;

    /**
     * Returns a closure the helps check whether a set of child Keys violate
     * mutual exclusivity constraints when added to a parent.
     *
     * The closure that is returned maintains a set of all child Keys passed
     * that did not collectively violate mutual exclusivity. Returns true if
     * the most recently passed Key does not violate mutual exclusivity.
     * Otherwise returns false. Keys that violate mutual exclusivity are not
     * added to the set of valid child keys.
     *
     * USE CASE: filtering a sequence of child keys to arrive at a sequence
     * that does not violate mutual exclusivity.
     */
    getIncrementalMutualExclusionPredicate(
        parent: Key
    ): (existing: string) => boolean;

    /**
     * Gets the default quantity of a child attached to a parent.
     *
     * @useCase When I add ketchup packets to a burger, I want to know whether I
     * should add one or two.
     */
    getDefaultQuantity(parent: Key, child: Key): number;

    /**
     * Predicate to validate that a quantity is within a threshold.
     *
     * @useCase If a drink comes with lemons, then I may want to limit the
     * number of lemons allowed in the drink to 5. If I pass this function 6 -
     * with drink as parent and lemons as child, then return false.
     */
    isValidQuantity(parent: Key, child: Key, qty: number): boolean;
}
