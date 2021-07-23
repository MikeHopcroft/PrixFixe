import fs from 'fs-extra';
import yaml from 'js-yaml';

import {
  AnyTurn,
  LogicalScoredSuite,
  LogicalTestSuite,
  LogicalValidationSuite,
} from '../core/test_suite/interfaces';

import {
  logicalScoredSuite,
  logicalTestSuite,
  logicalValidationSuite,
} from './validators';

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
  fs.outputFileSync(filename, yamlTextOut, 'utf8');
}
