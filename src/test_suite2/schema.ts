import * as AJV from 'ajv';
import * as betterAjvErrors from 'better-ajv-errors';

import { YAMLValidationError } from '../utilities';

import {
    AnyTurn,
    GenericSuite,
    Step,
    LogicalScoredSuite,
    LogicalTestSuite,
    LogicalValidationSuite
} from './interfaces';

export function logicalScoredSuite<TURN extends AnyTurn>(
    // tslint:disable-next-line:no-any
    root: any
): LogicalScoredSuite<TURN> {
    return validate<TURN, LogicalScoredSuite<TURN>>(
        "#/definitions/LogicalScoredSuite<TURN>",
        root
    ) as LogicalScoredSuite<TURN>;
}

export function logicalTestSuite<TURN extends AnyTurn>(
    // tslint:disable-next-line:no-any
    root: any
): LogicalTestSuite<TURN> {
    return validate<TURN, LogicalTestSuite<TURN>>(
        "#/definitions/LogicalScoredSuite<TURN>",
        root
    ) as LogicalTestSuite<TURN>;
}

export function logicalValidationSuite<TURN extends AnyTurn>(
    // tslint:disable-next-line:no-any
    root: any
): LogicalValidationSuite<TURN> {
    return validate<TURN, LogicalValidationSuite<TURN>>(
        "#/definitions/LogicalValidationSuite<TURN>",
        root
    ) as LogicalValidationSuite<TURN>;
}

function validate<TURN extends AnyTurn, SUITE extends GenericSuite<Step<TURN>>>(
    schemaRef: string,
    // tslint:disable-next-line:no-any
    root: any
): SUITE {
    const ajv = new AJV({ jsonPointers: true });
    const validator = ajv.compile(anySuiteSchema);

    if (!ajv.validate(schemaRef, root)) {
        const message = 'yaml data does not conform to schema.';
        const output = betterAjvErrors(
            anySuiteSchema,
            root,
            ajv.errors,
            { format: 'cli', indent: 1 }
        );
        console.log('hello');
        throw new YAMLValidationError(message, output || []);
    }

    return root as SUITE;
}

// Schema generated with
//   typescript-json-schema tsconfig.json AnySuite --required
const anySuiteSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "anyOf": [
        {
            "$ref": "#/definitions/LogicalTestSuite<TURN>",
        },
        {
            "$ref": "#/definitions/LogicalValidationSuite<TURN>",
        },
        {
            "$ref": "#/definitions/LogicalScoredSuite<TURN>",
        },
    ],
    "definitions": {
        "Expected": {
            "properties": {
                "cart": {
                    "$ref": "#/definitions/LogicalCart",
                },
            },
            "required": [
                "cart",
            ],
            "type": "object",
        },
        "GenericCase<ScoredStep<TURN>>": {
            "properties": {
                "comment": {
                    "type": "string",
                },
                "id": {
                    "type": "number",
                },
                "steps": {
                    "items": {
                        "allOf": [
                            {
                                "$ref": "#/definitions/Step<TURN>_1",
                            },
                            {
                                "$ref": "#/definitions/Expected",
                            },
                            {
                                "$ref": "#/definitions/Measures",
                            },
                        ],
                    },
                    "type": "array",
                },
                "suites": {
                    "type": "string",
                },
            },
            "required": [
                "comment",
                "id",
                "steps",
                "suites",
            ],
            "type": "object",
        },
        "GenericCase<Step<TURN>>": {
            "properties": {
                "comment": {
                    "type": "string",
                },
                "id": {
                    "type": "number",
                },
                "steps": {
                    "items": {
                        "$ref": "#/definitions/Step<TURN>",
                    },
                    "type": "array",
                },
                "suites": {
                    "type": "string",
                },
            },
            "required": [
                "comment",
                "id",
                "steps",
                "suites",
            ],
            "type": "object",
        },
        "GenericCase<ValidationStep<TURN>>": {
            "properties": {
                "comment": {
                    "type": "string",
                },
                "id": {
                    "type": "number",
                },
                "steps": {
                    "items": {
                        "allOf": [
                            {
                                "$ref": "#/definitions/Step<TURN>_1",
                            },
                            {
                                "$ref": "#/definitions/Expected",
                            },
                        ],
                    },
                    "type": "array",
                },
                "suites": {
                    "type": "string",
                },
            },
            "required": [
                "comment",
                "id",
                "steps",
                "suites",
            ],
            "type": "object",
        },
        "LogicalCart": {
            "properties": {
                "items": {
                    "items": {
                        "$ref": "#/definitions/LogicalItem",
                    },
                    "type": "array",
                },
            },
            "required": [
                "items",
            ],
            "type": "object",
        },
        "LogicalItem": {
            "properties": {
                "children": {
                    "items": {
                        "$ref": "#/definitions/LogicalItem",
                    },
                    "type": "array",
                },
                "name": {
                    "type": "string",
                },
                "quantity": {
                    "type": "number",
                },
                "sku": {
                    "type": "string",
                },
            },
            "required": [
                "children",
                "name",
                "quantity",
                "sku",
            ],
            "type": "object",
        },
        "LogicalScoredSuite<TURN>": {
            "properties": {
                "tests": {
                    "items": {
                        "$ref": "#/definitions/GenericCase<ScoredStep<TURN>>",
                    },
                    "type": "array",
                },
            },
            "required": [
                "tests",
            ],
            "type": "object",
        },
        "LogicalTestSuite<TURN>": {
            "properties": {
                "tests": {
                    "items": {
                        "$ref": "#/definitions/GenericCase<Step<TURN>>",
                    },
                    "type": "array",
                },
            },
            "required": [
                "tests",
            ],
            "type": "object",
        },
        "LogicalValidationSuite<TURN>": {
            "properties": {
                "tests": {
                    "items": {
                        "$ref": "#/definitions/GenericCase<ValidationStep<TURN>>",
                    },
                    "type": "array",
                },
            },
            "required": [
                "tests",
            ],
            "type": "object",
        },
        "Measures": {
            "properties": {
                "complete": {
                    "type": "boolean",
                },
                "perfect": {
                    "type": "boolean",
                },
                "repairs": {
                    "properties": {
                        "cost": {
                            "type": "number",
                        },
                        "steps": {
                            "items": {
                                "type": "string",
                            },
                            "type": "array",
                        },
                    },
                    "required": [
                        "cost",
                        "steps",
                    ],
                    "type": "object",
                },
            },
            "required": [
                "complete",
                "perfect",
            ],
            "type": "object",
        },
        "Step<TURN>": {
            "properties": {
                "turns": {
                    "items": {
                        "$ref": "#/definitions/TURN",
                    },
                    "type": "array",
                },
            },
            "required": [
                "turns",
            ],
            "type": "object",
        },
        "Step<TURN>_1": {
            "properties": {
                "turns": {
                    "items": {
                        "$ref": "#/definitions/TURN",
                    },
                    "type": "array",
                },
            },
            "required": [
                "turns",
            ],
            "type": "object",
        },
        "TURN": {
            "properties": {
                "audio": {
                    "type": "string",
                },
                "speaker": {
                    "type": "string",
                },
                "transcription": {
                    "type": "string",
                },
            },
            "required": [
                "speaker",
            ],
            "type": "object",
        },
    },
};

