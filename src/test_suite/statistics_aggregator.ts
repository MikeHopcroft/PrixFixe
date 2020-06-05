export interface Statistics {
  count: number;
  min: number;
  max: number;
  mean: number;
  percentiles: Map<number, number>;
}

export class StatisticsAggregator {
  private sum = 0;
  private values: number[] = [];

  record(value: number) {
    this.values.push(value);
  }

  // Generate a Statictics object if one or more values have been recorded.
  // Otherwise return null.
  computeStatistics(percentileKeys: number[]): Statistics | null {
    if (this.values.length < 1) {
      // There are no values on which to compute statistics.
      return null;
    }

    const values = [...this.values].sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const percentiles = new Map<number, number>();
    for (const key of percentileKeys) {
      if (key < 0.0 || key >= 1.0) {
        const message =
          'computeStatistics: percentile key must be in range [0,1).';
        throw TypeError(message);
      }
      percentiles.set(key, values[Math.floor(key * values.length)]);
    }

    return {
      count: values.length,
      min,
      max,
      mean,
      percentiles,
    };
  }
}

export function printStatistics(
  title: string,
  units: string,
  statistics: Statistics
) {
  console.log(`${title} Statistics:`);
  console.log(`  count: ${statistics.count}`);
  console.log(`  min: ${statistics.min.toFixed(3)}${units}`);
  console.log(`  max: ${statistics.max.toFixed(3)}${units}`);
  console.log(`  mean: ${statistics.mean.toFixed(3)}${units}`);
  console.log('  percentiles:');
  for (const [key, value] of statistics.percentiles.entries()) {
    console.log(`    ${rightJustify(key.toFixed(3), 5)}: ${value}${units}`);
  }
}

function rightJustify(text: string, width: number) {
  if (text.length >= width) {
    return text;
  } else {
    const paddingWidth = width - text.length;
    const padding = new Array(paddingWidth + 1).join(' ');
    return padding + text;
  }
}
