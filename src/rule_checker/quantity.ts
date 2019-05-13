import {
    PID,
    KEY,
} from '../catalog';

import {
    RuleConfig,
    QuantityInformation,
} from './interfaces';

export interface QuantityTensor {
    // NOTE: Weird how I can't use KEY type alias here:
    //   https://github.com/microsoft/TypeScript/issues/1778
    [key: string]: QuantityInformation;
}

export const quantityTensorFactory = (
    rulsSet: RuleConfig
): QuantityTensor => {
    return {};
};
