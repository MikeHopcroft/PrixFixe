import { AttributeInfo } from '../attributes';
import { ICatalog } from '../catalog';

import {
    GenericCase,
    LogicalValidationSuite,
    LogicalScoredSuite,
    ScoredStep,
    ValidationStep,
} from './interfaces';

import { cartIsComplete } from './complete_cart';
import { cartFromlogicalCart } from './logical_cart';
import { TreeRepairs } from './tree_repairs';

export class SuiteScorer {
    private catalog: ICatalog;
    private repairs: TreeRepairs;

    constructor(attributeInfo: AttributeInfo, catalog: ICatalog) {
        this.catalog = catalog;
        this.repairs = new TreeRepairs(attributeInfo, catalog);
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

        return { ...observed, tests };
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
        const o = cartFromlogicalCart(observed.cart, this.catalog);
        const e = cartFromlogicalCart(expected.cart, this.catalog);
        const results = this.repairs.repairCart(o, e);

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
