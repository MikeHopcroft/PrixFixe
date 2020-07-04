import { formatAggregateMeasures } from './aggregate';
import { enumerateTestCases } from './filter';
import { AnyTurn, LogicalScoredSuite } from './interfaces';
import { PassFailRates } from './pass_fail_rates';
import { renderCart } from './markdown';

export interface FormatScoredSuiteOptions {
  showDetails: boolean;
  showPassing: boolean;
  showFailing: boolean;
  showMeasures: boolean;
  showBySuite: boolean;
}

export function formatScoredSuite(
  fragments: string[],
  scored: LogicalScoredSuite<AnyTurn>,
  options: FormatScoredSuiteOptions = {
    showDetails: true,
    showPassing: false,
    showFailing: true,
    showMeasures: true,
    showBySuite: true,
  }
): string[] {
  fragments.push('---------------------------------------');
  const passFailRates = new PassFailRates();
  for (const test of enumerateTestCases(scored)) {
    const repairCost = test.steps.reduce(
      (p, c) => p + c.measures.repairs!.cost,
      0
    );

    passFailRates.record(test.suites, repairCost === 0);

    const passing = repairCost === 0;

    if (options.showDetails) {
      if (
        (passing && options.showPassing) ||
        (!passing && options.showFailing)
      ) {
        // TODO: line formatter handles indent for multi-line
        fragments.push(`${test.id}: ${test.comment}`);
        for (const [index, step] of test.steps.entries()) {
          const { repairs } = step.measures;
          const status = repairs!.cost > 0 ? 'NEEDS REPAIRS' : 'OK';
          fragments.push(`  step ${index}: ${status}`);

          for (const turn of step.turns) {
            if ('transcription' in turn) {
              fragments.push(`    ${turn.speaker}: ${turn.transcription}`);
            }
          }
          fragments.push(' ');

          const lines: string[] = [];
          renderCart(lines, step.cart);
          for (const line of lines) {
            fragments.push('    ' + line);
          }

          fragments.push(' ');
          for (const edit of repairs!.steps) {
            fragments.push(`    ${edit}`);
          }
        }
        fragments.push(' ');
        fragments.push('---------------------------------------');
      }
    }
  }

  // Print out summary.
  if (options.showMeasures) {
    formatAggregateMeasures(fragments, scored.measures);
    fragments.push(' ');

    if (options.showBySuite) {
      fragments.push('Case pass rate by suite:');
      const lines = passFailRates.format();
      for (const line of lines) {
        fragments.push('  ' + line);
      }
    }
    fragments.push('---------------------------------------');
  }

  fragments.push('');
  fragments.push('');

  return fragments;
}
