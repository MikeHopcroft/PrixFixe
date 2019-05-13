import * as AJV from 'ajv';

import {
    RuleConfig,
} from './interfaces';

const ruleConfigSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "PartialRule": {
            "properties": {
                "exclusionZones": {
                    "items": {
                        "additionalProperties": false,
                        "patternProperties": {
                            "^[0-9]+$": {
                                "items": {
                                    "type": "number",
                                },
                                "type": "array",
                            },
                        },
                        "type": "object",
                    },
                    "type": "array",
                },
                "partialKey": {
                    "type": "string",
                },
                "validCatagoryMap": {
                    "additionalProperties": false,
                    "patternProperties": {
                        "^[0-9]+$": {
                            "items": {
                                "type": "number",
                            },
                            "type": "array",
                        },
                    },
                    "type": "object",
                },
            },
            "required": [
                "exclusionZones",
                "partialKey",
                "validCatagoryMap",
            ],
            "type": "object",
        },
    },
    "properties": {
        "rules": {
            "items": {
                "$ref": "#/definitions/PartialRule",
            },
            "type": "array",
        },
    },
    "required": [
        "rules",
    ],
    "type": "object",
};

const ajv = new AJV();
const ruleConfigValidator = ajv.compile(ruleConfigSchema);

export const validateRuleConfig = (ruleConfig: RuleConfig) => {
    if (!ruleConfigValidator(ruleConfig)) {
        const message =
            'validateRuleConfig: Invalid `rules.yaml` config file.';
        console.error(message);
        console.error(ruleConfigValidator.errors);
        throw TypeError(message);
    }
};
