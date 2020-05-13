import * as AJV from 'ajv';
import * as betterAjvErrors from 'better-ajv-errors';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

import { YAMLValidationError } from '../utilities';

import {
    AnyTurn,
    GenericSuite,
    Step,
    LogicalScoredSuite,
    LogicalTestSuite,
    LogicalValidationSuite,
} from './interfaces';

import { anySuiteSchema } from './schema';

///////////////////////////////////////////////////////////////////////////////
//
// Loaders
//
///////////////////////////////////////////////////////////////////////////////
export function loadLogicalScoredSuite<TURN extends AnyTurn>(
    filename: string
): LogicalScoredSuite<TURN> {
    const yamlTextIn = fs.readFileSync(filename, 'utf8');
    const root = yaml.safeLoad(yamlTextIn);
    return logicalScoredSuite<TURN>(root);
}

export function loadLogicalTestSuite<TURN extends AnyTurn>(
    filename: string
): LogicalTestSuite<TURN> {
    const yamlTextIn = fs.readFileSync(filename, 'utf8');
    const root = yaml.safeLoad(yamlTextIn);
    return logicalTestSuite<TURN>(root);
}

export function loadLogicalValidationSuite<TURN extends AnyTurn>(
    filename: string
): LogicalValidationSuite<TURN> {
    const yamlTextIn = fs.readFileSync(filename, 'utf8');
    const root = yaml.safeLoad(yamlTextIn);
    return logicalValidationSuite<TURN>(root);
}

///////////////////////////////////////////////////////////////////////////////
//
// Writer
//
///////////////////////////////////////////////////////////////////////////////
export function writeYAML<T>(filename: string, root: T) {
    const yamlTextOut = yaml.safeDump(root);
    fs.writeFileSync(filename, yamlTextOut, 'utf8');
}

///////////////////////////////////////////////////////////////////////////////
//
// Validators
//
///////////////////////////////////////////////////////////////////////////////
export function logicalScoredSuite<TURN extends AnyTurn>(
    // tslint:disable-next-line:no-any
    root: any
): LogicalScoredSuite<TURN> {
    return validate<TURN, LogicalScoredSuite<TURN>>(
        '#/definitions/LogicalScoredSuite<TURN>',
        root
    ) as LogicalScoredSuite<TURN>;
}

export function logicalTestSuite<TURN extends AnyTurn>(
    // tslint:disable-next-line:no-any
    root: any
): LogicalTestSuite<TURN> {
    return validate<TURN, LogicalTestSuite<TURN>>(
        '#/definitions/LogicalScoredSuite<TURN>',
        root
    ) as LogicalTestSuite<TURN>;
}

export function logicalValidationSuite<TURN extends AnyTurn>(
    // tslint:disable-next-line:no-any
    root: any
): LogicalValidationSuite<TURN> {
    return validate<TURN, LogicalValidationSuite<TURN>>(
        '#/definitions/LogicalValidationSuite<TURN>',
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
        const output = betterAjvErrors(anySuiteSchema, root, ajv.errors, {
            format: 'cli',
            indent: 1,
        });
        throw new YAMLValidationError(message, output || []);
    }

    return root as SUITE;
}
