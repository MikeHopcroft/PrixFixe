import { PID, Key, GenericTypedEntity } from '../catalog';
import { RuleConfig, CategoryInfo } from './interfaces';

/**
 * Given a child PID, is this child valid at the tensor coordinate?
 */
export interface ValidChildPredicate {
    (child: Key): boolean;
}

export interface ValidChildTensor {
    // NOTE: Weird how I can't use Key type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: ValidChildPredicate;
}

/**
 * The child tensor encodes a hierarchy of predicates which determine whether a
 * child may be attached to a specific parent.
 */
export const childTensorFactory = (
    ruleSet: RuleConfig,
    genMap: Map<PID, GenericTypedEntity>
): ValidChildTensor => {
    const childTensor: ValidChildTensor = {};

    for (const rule of ruleSet.rules) {
        // Assign a ValidChildPredicate function to the partial key
        childTensor[rule.partialKey] = (child: Key): boolean => {
            // API specifies Key, but we use PIDs in this implementation
            const childPID = Number(child.split(':')[0]);
            const option = genMap.get(childPID);

            // If the option exists
            if (option) {
                const categoryID = option.cid;
                const category = rule.validCategoryMap[categoryID];

                // If the category of the option is valid for the partial key
                if (category) {
                    // If the PID exists as a valid generic in the category
                    if (category.validOptions.indexOf(childPID) > -1) {
                        return true;
                    }
                }
            }

            return false;
        };
    }

    return childTensor;
};

export type ValidChildren = Map<Key, Set<PID>>;

export function validChildrenFactory(
    ruleSet: RuleConfig,
    genericMap: Map<PID, GenericTypedEntity>
) {
    const keyToPIDs = new Map<Key, Set<PID>>();

    for (const rule of ruleSet.rules) {
        for (const [cid, value] of Object.entries(rule.validCategoryMap)) {
            const info = value as CategoryInfo;

            const pids = keyToPIDs.get(rule.partialKey);
            if (pids === undefined) {
                keyToPIDs.set(rule.partialKey, new Set(info.validOptions));
            } else {
                for (const pid of info.validOptions) {
                    const child = genericMap.get(pid);
                    // NOTE: it is possible for the rules to mention a pid that
                    // is not in the catalog. Therefore, child could be
                    // undefined.
                    if (child !== undefined && child.cid === Number(cid)) {
                        pids.add(pid);
                    }
                }
            }
        }
    }

    return keyToPIDs;
}
