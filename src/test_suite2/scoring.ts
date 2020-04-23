import { aggregateMeasures } from './aggregate';
import { cartIsComplete } from './complete_cart';

import {
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

export function scoreSuite<TURN>(
    observed: LogicalValidationSuite<TURN>,
    expected: LogicalValidationSuite<TURN>,
    repairFunction: RepairFunction,
    notes: string
): LogicalScoredSuite<TURN> {
    if (observed.tests.length !== expected.tests.length) {
        const message = `test count mismatch`;
        throw new TypeError(message);
    }

    const tests: Array<GenericCase<ScoredStep<TURN>>> = [];
    for (const [i, o] of observed.tests.entries()) {
        const e = expected.tests[i];
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
        const message = `step count mismatch`;
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
