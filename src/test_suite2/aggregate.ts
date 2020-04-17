import { LogicalScoredSuite } from './interfaces';

export interface AggregatedMeasures {
    totalSteps: number;
    perfectSteps: number;
    completeSteps: number;
    totalRepairs: number;
}

export function aggregateMeasures<TURN>(
    suite: LogicalScoredSuite<TURN>
): AggregatedMeasures {
    let totalSteps = 0;
    let perfectSteps = 0;
    let completeSteps = 0;
    let totalRepairs = 0;

    for (const test of suite.tests) {
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
        totalSteps,
        perfectSteps,
        completeSteps,
        totalRepairs,
    };
}
