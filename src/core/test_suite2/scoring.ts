import { aggregateMeasures } from './aggregate';
import { cartIsComplete } from './complete_cart';
import { enumerateTestCases } from './filter';

import {
  AnyTurn,
  GenericCase,
  LogicalValidationSuite,
  LogicalScoredSuite,
  ScoredStep,
  ValidationStep,
  LogicalCart,
} from './interfaces';

import { cartIsPerfect } from './perfect_cart';
import { DiffResults } from './tree_diff';

export type RepairFunction = (
  observed: LogicalCart,
  expected: LogicalCart
) => DiffResults<string>;

export function scoreSuite(
  observed: LogicalValidationSuite<AnyTurn>,
  expected: LogicalValidationSuite<AnyTurn>,
  repairFunction: RepairFunction,
  notes: string
): LogicalScoredSuite<AnyTurn> {
  const expectedCases = [...enumerateTestCases(expected)];
  const observedCases = [...enumerateTestCases(observed)];

  if (observedCases.length !== expectedCases.length) {
    const message = 'test count mismatch';
    throw new TypeError(message);
  }

  const tests: Array<GenericCase<ScoredStep<AnyTurn>>> = [];
  for (const [i, o] of observedCases.entries()) {
    const e = expectedCases[i];
    tests.push(scoreOneCase(o, e, repairFunction));
  }

  const measures = aggregateMeasures(tests, notes);

  return { ...observed, tests, measures };
}

function scoreOneCase<TURN>(
  observed: GenericCase<ValidationStep<TURN>>,
  expected: GenericCase<ValidationStep<TURN>>,
  repairFunction: RepairFunction
): GenericCase<ScoredStep<TURN>> {
  if (observed.steps.length !== expected.steps.length) {
    const message = 'step count mismatch';
    throw new TypeError(message);
  }

  const steps: Array<ScoredStep<TURN>> = [];
  for (const [i, o] of observed.steps.entries()) {
    const e = expected.steps[i];
    steps.push(scoreOneStep(o, e, repairFunction));
  }

  return { ...observed, steps };
}

function scoreOneStep<TURN>(
  observed: ValidationStep<TURN>,
  expected: ValidationStep<TURN>,
  repairFunction: RepairFunction
): ScoredStep<TURN> {
  const results = repairFunction(observed.cart, expected.cart);

  const repairs = {
    cost: results.cost,
    steps: [] as string[],
  };
  for (const edit of results.edits) {
    for (const step of edit.steps) {
      repairs.steps.push(step);
    }
  }

  const complete = cartIsComplete(observed.cart, expected.cart);

  // DESIGN NOTE: could use repairs.cost === 0 as a proxy for
  // cartItPerfect(), but some RepairFunctions return NaN.
  const perfect = cartIsPerfect(observed.cart, expected.cart);

  return {
    ...observed,
    measures: { perfect, complete, repairs },
  };
}
