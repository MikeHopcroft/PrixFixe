import * as AJV from 'ajv';
import * as betterAjvErrors from 'better-ajv-errors';

import { YAMLValidationError } from '../core/utilities';

import {
  anySuiteSchema,
  AnyTurn,
  GenericSuite,
  Step,
  LogicalScoredSuite,
  LogicalTestSuite,
  LogicalValidationSuite,
} from '../core/test_suite2';

///////////////////////////////////////////////////////////////////////////////
//
// Validators
//
///////////////////////////////////////////////////////////////////////////////
export function logicalScoredSuite<TURN extends AnyTurn>(
  // TODO: why is root of type `any`?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  root: any
): LogicalScoredSuite<TURN> {
  // DESIGN NOTE: need to use two-step validation process here because schema
  // exporter doesn't create a ref for LogicalScoredSuite<TURN>.
  const validationSuite = logicalValidationSuite(root);
  return validate<TURN, LogicalScoredSuite<TURN>>(
    '#/definitions/AggregatedMeasuresField',
    validationSuite
  ) as LogicalScoredSuite<TURN>;
}

export function logicalTestSuite<TURN extends AnyTurn>(
  // TODO: why is root of type `any`?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  root: any
): LogicalTestSuite<TURN> {
  return validate<TURN, LogicalTestSuite<TURN>>(
    '#/definitions/LogicalTestSuite<TURN>',
    root
  ) as LogicalTestSuite<TURN>;
}

export function logicalValidationSuite<TURN extends AnyTurn>(
  // TODO: why is root of type `any`?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  root: any
): LogicalValidationSuite<TURN> {
  return validate<TURN, LogicalValidationSuite<TURN>>(
    '#/definitions/LogicalValidationSuite<TURN>',
    root
  ) as LogicalValidationSuite<TURN>;
}

function validate<TURN extends AnyTurn, SUITE extends GenericSuite<Step<TURN>>>(
  schemaRef: string,
  // TODO: why is root of type `any`?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  root: any
): SUITE {
  const validator = new AJV().addSchema(anySuiteSchema);

  if (!validator.validate(schemaRef, root)) {
    const message = 'yaml data does not conform to schema.';
    const output = betterAjvErrors(anySuiteSchema, root, validator.errors, {
      format: 'cli',
      indent: 1,
    });
    console.log(JSON.stringify(output, null, 4));
    throw new YAMLValidationError(message, output || []);
  }

  return root as SUITE;
}
