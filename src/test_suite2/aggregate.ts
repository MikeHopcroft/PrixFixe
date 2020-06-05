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

export function formatAggregateMeasures(
  fragments: string[],
  measures: AggregatedMeasures
) {
  fragments.push(`Repair algorithm: ${measures.notes}`);
  fragments.push(`Total test cases: ${measures.totalTests}`);
  fragments.push(`Total steps: ${measures.totalSteps}`);
  fragments.push(
    formatFraction('Perfect carts', measures.perfectSteps, measures.totalSteps)
  );
  fragments.push(
    formatFraction(
      'Complete carts',
      measures.completeSteps,
      measures.totalSteps
    )
  );
  fragments.push(
    formatFraction(
      'Repaired carts',
      measures.totalSteps - measures.completeSteps,
      measures.totalSteps
    )
  );
  fragments.push(`Total repairs: ${measures.totalRepairs}`);
  fragments.push(
    `Repairs/Step: ${(measures.totalRepairs / measures.totalSteps).toFixed(2)}`
  );
}

function formatFraction(name: string, n: number, d: number): string {
  const percent = ((n / d) * 100).toFixed(1);
  return `${name}: ${n}/${d} (${percent}%)`;
}
