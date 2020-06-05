import { formatOrder } from '../repl';
import { AggregatedResults } from './test_suite';

export function createMarkdown(aggregator: AggregatedResults): string {
  const lines: string[] = [];
  for (const result of aggregator.results) {
    const test = result.test;
    let comment = test.comment;
    if (comment.length > 0) {
      comment = comment.charAt(0).toUpperCase() + comment.slice(1) + ':';
      lines.push(comment);
    }
    lines.push('~~~');
    for (let i = 0; i < test.steps.length; ++i) {
      if (i > 0) {
        lines.push('');
      }
      lines.push(`% ${test.steps[i]}`);
      lines.push(formatOrder(result.observed[i]));
    }
    lines.push('~~~');
  }
  return lines.join('\n');
}
