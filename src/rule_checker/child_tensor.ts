import { PID, KEY, GenericTypedEntity } from '../catalog';

import { RuleConfig } from './interfaces';

// Given a child PID, is this child valid at the tensor coordinate?
export interface ValidChildPredicate {
    (child: KEY): boolean;
}

export interface ValidChildTensor {
    // NOTE: Weird how I can't use KEY type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: ValidChildPredicate;
}

// The child tensor encodes a hierarchy of predicates which determine whether
//   a child may be attached to a specific parent
export const childTensorFactory = (
    ruleSet: RuleConfig,
    genMap: Map<PID, GenericTypedEntity>
): ValidChildTensor => {
    const childTensor: ValidChildTensor = {};

    for (const rule of ruleSet.rules) {
        // Assign a ValidChildPredicate function to the partial key
        childTensor[rule.partialKey] = (child: KEY): boolean => {
            // API specifies KEY, but we use PIDs in this implementation
            const childPID = Number(child.split(':')[0]);
            const option = genMap.get(childPID);

            // If the option exists
            if (option) {
                const catagoryID = option.cid;
                const catagory = rule.validCatagoryMap[catagoryID];

                // If the catagory of the option is valid for the partial key
                if (catagory) {
                    // If the PID exists as a valid generic in the catagory
                    if (catagory.validOptions.indexOf(childPID) > -1) {
                        return true;
                    }
                }
            }
            
            return false;
        };
    }

    return childTensor;
};
