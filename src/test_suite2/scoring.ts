import {
    GenericCase,
    LogicalValidationSuite,
    LogicalScoredSuite,
    ScoredStep,
    ValidationStep,
    LogicalCart,
} from './interfaces';

import { aggregateMeasures } from './aggregate';
import { cartIsComplete } from './complete_cart';
import { DiffResults } from './tree_diff';

export type RepairFunction = (
    observed: LogicalCart,
    expected: LogicalCart
) => DiffResults<string>;

export class SuiteScorer {
    private repairs: RepairFunction;

    constructor(repairs: RepairFunction) {
        this.repairs = repairs;
    }

    scoreSuite<TURN>(
        observed: LogicalValidationSuite<TURN>,
        expected: LogicalValidationSuite<TURN>
    ): LogicalScoredSuite<TURN> {
        if (observed.tests.length !== expected.tests.length) {
            const message = `test count mismatch`;
            throw new TypeError(message);
        }

        const tests: Array<GenericCase<ScoredStep<TURN>>> = [];
        for (const [i, o] of observed.tests.entries()) {
            const e = expected.tests[i];
            tests.push(this.scoreOneCase(o, e));
        }

        const measures = aggregateMeasures(tests);

        return { ...observed, tests, measures };
    }

    private scoreOneCase<TURN>(
        observed: GenericCase<ValidationStep<TURN>>,
        expected: GenericCase<ValidationStep<TURN>>
    ): GenericCase<ScoredStep<TURN>> {
        if (observed.steps.length !== expected.steps.length) {
            const message = `step count mismatch`;
            throw new TypeError(message);
        }

        const steps: Array<ScoredStep<TURN>> = [];
        for (const [i, o] of observed.steps.entries()) {
            const e = expected.steps[i];
            steps.push(this.scoreOneStep(o, e));
        }

        return { ...observed, steps };
    }

    private scoreOneStep<TURN>(
        observed: ValidationStep<TURN>,
        expected: ValidationStep<TURN>
    ): ScoredStep<TURN> {
        const results = this.repairs(observed.cart, expected.cart);

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

        return {
            ...observed,
            measures: {
                perfect: repairs.cost === 0,
                complete,
                repairs,
            },
        };
    }
}
