import { Key, PID, GenericTypedEntity } from '../catalog';
import { RuleConfig } from './interfaces';

/**
 * Given a two modifiers, are they mutually exlusive with each other?
 */
export interface MutualExclusionZone {
    (modOne: Key): number;
}

export interface ExclusionTensor {
    // NOTE: Weird how I can't use Key type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: MutualExclusionZone;
}

export const mutualExclusionTensorFactory = (
    ruleSet: RuleConfig,
    genMap: Map<PID, GenericTypedEntity>
): ExclusionTensor => {
    const exclusionTensor: ExclusionTensor = {};

    for (const rule of ruleSet.rules) {
        exclusionTensor[rule.partialKey] = (modOne: Key): number => {
            const modPID = Number(modOne.split(':')[0]);
            const option = genMap.get(modPID);

            if (option) {
                const catagoryID = option.cid;
                const exclusionZone = rule.exclusionZones[catagoryID];

                if (exclusionZone) {
                    if (exclusionZone.indexOf(modPID) > -1) {
                        return catagoryID;
                    }
                }
            }

            return -1;
        };
    }

    return exclusionTensor;
};
