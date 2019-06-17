import { PID, Key, GenericTypedEntity } from '../catalog';

import { RuleConfig, QuantityInformation } from './interfaces';

export interface QuantityMap {
    (child: Key, downstream: Key): QuantityInformation | undefined;
}

export interface QuantityTensor {
    // NOTE: Weird how I can't use Key type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: QuantityMap;
}

export const quantityTensorFactory = (
    ruleSet: RuleConfig,
    genMap: Map<PID, GenericTypedEntity>
): QuantityTensor => {
    const quantityTensor: QuantityTensor = {};

    for (const rule of ruleSet.rules) {
        quantityTensor[rule.partialKey] = (child: Key, downstream: Key) => {
            const childPID = Number(child.split(':')[0]);
            const option = genMap.get(childPID);

            if (option) {
                const categoryID = option.cid;
                const category = rule.validCategoryMap[categoryID];

                if (category) {
                    return category.qtyInfo[downstream];
                }
            }

            return undefined;
        };
    }

    return quantityTensor;
};
