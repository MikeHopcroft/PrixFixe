import * as AJV from 'ajv';
import * as YAML from 'js-yaml';

import { RuleConfig } from './interfaces';

const ruleConfigSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
        CatagoryInfo: {
            properties: {
                qtyInfo: {
                    $ref: '#/definitions/QuantityInformation',
                },
                validOptions: {
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
            },
            required: ['qtyInfo', 'validOptions'],
            type: 'object',
        },
        PartialRule: {
            properties: {
                exclusionZones: {
                    additionalProperties: false,
                    patternProperties: {
                        '^[0-9]+$': {
                            items: {
                                type: 'number',
                            },
                            type: 'array',
                        },
                    },
                    type: 'object',
                },
                partialKey: {
                    type: 'string',
                },
                validCatagoryMap: {
                    additionalProperties: false,
                    patternProperties: {
                        '^[0-9]+$': {
                            $ref: '#/definitions/CatagoryInfo',
                        },
                    },
                    type: 'object',
                },
            },
            required: ['exclusionZones', 'partialKey', 'validCatagoryMap'],
            type: 'object',
        },
        QuantityInformation: {
            properties: {
                defaultQty: {
                    type: 'number',
                },
                maxQty: {
                    type: 'number',
                },
                minQty: {
                    type: 'number',
                },
            },
            required: ['defaultQty', 'maxQty', 'minQty'],
            type: 'object',
        },
    },
    properties: {
        rules: {
            items: {
                $ref: '#/definitions/PartialRule',
            },
            type: 'array',
        },
    },
    required: ['rules'],
    type: 'object',
};

const ajv = new AJV();
const ruleConfigValidator = ajv.compile(ruleConfigSchema);

export const validateRuleConfig = (ruleConfig: RuleConfig) => {
    if (!ruleConfigValidator(ruleConfig)) {
        const message = 'validateRuleConfig: Invalid `rules.yaml` config file.';
        console.error(message);
        console.error(ruleConfigValidator.errors);
        throw TypeError(message);
    }
};

////////////////////////////////
// Temp function, this will likely land elsewhere
////////////////////////////////
export const loadRuleConfig = (yamlText: string) => {
    const yamlRoot = YAML.safeLoad(yamlText) as RuleConfig;

    validateRuleConfig(yamlRoot);

    return yamlRoot;
};
