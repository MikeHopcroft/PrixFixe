import { CID, PID, KEY } from '../catalog';

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

export interface CatagoryInfo {
    validOptions: PID[];
    qtyInfo: DownstreamQuantity;
}

export interface CatagoryMap {
    [cid: number]: CatagoryInfo;
}

export interface ExclusionSet {
    [cid: number]: PID[];
}

export interface PartialRule {
    partialKey: KEY;
    validCatagoryMap: CatagoryMap;
    exclusionZones: ExclusionSet;
    specificExceptions: KEY[];
}

/**
 * The shape of the `rule.yaml` file.
 *
 * @todo define shape of RuleConfig.
 */
export interface RuleConfig {
    rules: PartialRule[];
}

export interface RuleCheckerOps {
    /**
     * Check if an item is a valid child for another item. Uses a
     * ValidChildTensor to build a set of predicates, which must evaluate to
     * true over their intersection.
     *
     * @useCase Can an ingredient be added to a standalone item?
     */
    isValidChild(parent: KEY, child: KEY): boolean;

    /**
     * Check if two modifiers are in a mutually exclusive set
     *
     * @useCase If a pizza has red sauce as a child item, then I want to know if
     * it can also have white sauce as a child item.
     *
     * @issue should items be mutally exclusive with themselves?
     */
    isMutuallyExclusive(parent: KEY, modSet: IterableIterator<KEY>): boolean;

    /**
     * Gets the default quantity of a child attached to a parent.
     *
     * @useCase When I add ketchup packets to a burger, I want to know whether I
     * should add one or two.
     */
    getDefaultQuantity(parent: KEY, child: KEY): number;

    /**
     * Predicate to validate that a quantity is within a threshold.
     *
     * @useCase If a drink comes with lemons, then I may want to limit the
     * number of lemons allowed in the drink to 5. If I pass this function 6 -
     * with drink as parent and lemons as child, then return false.
     */
    isValidQuantity(parent: KEY, child: KEY, qty: number): boolean;
}
