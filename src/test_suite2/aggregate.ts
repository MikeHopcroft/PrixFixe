import { AggregatedMeasures, GenericCase, ScoredStep } from './interfaces';

export function aggregateMeasures<TURN>(
    tests: Array<GenericCase<ScoredStep<TURN>>>,
    notes: string
): AggregatedMeasures {
    let totalTests = 0;
    let totalSteps = 0;
    let perfectSteps = 0;
    let completeSteps = 0;
    let totalRepairs = 0;

    for (const test of tests) {
        ++totalTests;
        for (const step of test.steps) {
            const measures = step.measures;
            ++totalSteps;
            if (measures.perfect) {
                ++perfectSteps;
            }
            if (measures.complete) {
                ++completeSteps;
            }
            if (measures.repairs) {
                totalRepairs += measures.repairs.cost;
            }
        }
    }

    return {
        notes,
        totalTests,
        totalSteps,
        perfectSteps,
        completeSteps,
        totalRepairs,
    };
}

export function printAggregateMeasures(measures: AggregatedMeasures) {
    console.log(`repair algorithm: ${measures.notes}`);
    console.log(`total test cases: ${measures.totalTests}`);
    console.log(`total steps: ${measures.totalSteps}`);
    formatFraction('perfect carts', measures.perfectSteps, measures.totalSteps);
    formatFraction(
        'complete carts',
        measures.completeSteps,
        measures.totalSteps
    );
    console.log(`total repairs: ${measures.totalRepairs}`);
    console.log(
        `repairs/step: ${(measures.totalRepairs / measures.totalSteps).toFixed(
            2
        )}`
    );
}

function formatFraction(name: string, n: number, d: number) {
    const percent = ((n / d) * 100).toFixed(1);
    console.log(`${name}: ${n}/${d} (${percent}%)`);
}
