import * as AJV from 'ajv';
import * as betterAjvErrors from 'better-ajv-errors';
import * as Debug from 'debug';
import * as jsontoxml from 'jsontoxml';
import * as yaml from 'js-yaml';

import { ICatalog } from '../core/catalog';
import { Processor, State } from '../core/processors';
import { testOrderFromCart } from '../repl';
import { YAMLValidationError } from '../core/utilities';

import {
  TestLineItem,
  TestCounts,
  TestOrder,
  XmlNode,
  YamlTestCase,
  TestStep,
  CorrectionLevel,
} from './interfaces';

import { printStatistics, StatisticsAggregator } from './statistics_aggregator';
import { allSuites, SuitePredicate } from './suite_predicate';

const debug = Debug('prix-fixe:TestSuite.fromYamlString');

export type SpeechToTextSimulator = (text: string) => string;

///////////////////////////////////////////////////////////////////////////////
//
// AggregatedResults
//
// Holds the Result objects produced by a test suite run.
// Maintains aggregate pass/fail counts by priority and suite.
// Formats and prints test results.
//
///////////////////////////////////////////////////////////////////////////////

// String constant used to label tests that have been rebased.
const UNVERIFIED = 'unverified';

// Holds the results of one TestCase run.
export class Result {
  // TestCase that generated this Result.
  readonly test: TestCase;

  // The sequence of Orders produced by the test run.
  readonly observed: TestOrder[];

  // Determination of the success of the test case.
  readonly passed: boolean;

  readonly exception: string | undefined;

  // Latency in milliseconds.
  readonly latencyMS: number;

  constructor(
    test: TestCase,
    observed: TestOrder[],
    passed: boolean,
    exception: string | undefined,
    latencyMS: number
  ) {
    this.test = test;
    this.observed = observed;
    this.passed = passed;
    this.exception = exception;
    this.latencyMS = latencyMS;
  }

  rebase(): YamlTestCase {
    const t = this.test;
    let suites = t.suites;

    // If this test case failed,
    // Add the 'unverified' suite to mark this test as having expected
    // output that has not yet been verified as correct. After generating
    // a test suite, the user should verify and correct the expected
    // output for each case, and then remove the 'unverified' mark.
    if (!this.passed && !t.suites.includes(UNVERIFIED)) {
      suites = suites.concat(UNVERIFIED);
    }

    return {
      suites: suites.join(' '),
      comment: t.comment,
      steps: t.steps,
    };
  }

  toString(isomorphic = false, correctionLevel = CorrectionLevel.Scoped) {
    let stringValue = '';
    const suites = this.test.suites.join(' ');
    const passFail = this.passed ? 'PASSED' : 'FAILED';
    const exception = this.exception ? ' *** EXCEPTION THROWN ***' : '';
    stringValue += `${this.test.id} - ${passFail}${exception}\n`;
    stringValue += `  Comment: ${this.test.comment}\n`;
    stringValue += `  Suites: ${suites}\n`;

    if (this.exception) {
      stringValue += `  Exception message: "${this.exception}"\n`;
      for (const [index, step] of this.test.steps.entries()) {
        const input = getYamlInputText(step, correctionLevel);
        stringValue += `  Utterance ${index}: "${input}"\n`;
      }
    } else {
      this.test.steps.forEach((step, index) => {
        const input = getYamlInputText(step, correctionLevel);
        const observed = this.observed[index];
        const expected = step;

        stringValue += `  Utterance ${index}: "${input}"\n`;

        if (isomorphic) {
          stringValue += getDifferencesTextCanonical(observed, expected);
        } else {
          stringValue += getDifferencesText(observed, expected);
        }
      });
    }
    return stringValue;
  }

  toJUnitXml(
    isomorphic = false,
    correctionLevel: CorrectionLevel = CorrectionLevel.Scoped
  ): XmlNode {
    const testCase = this.test.toJUnitXml();

    testCase.attrs.time = (this.latencyMS / 1.0e3).toFixed(3);
    if (!this.passed) {
      testCase.children = new Array<XmlNode>();
      let failureMessage = '';
      if (this.exception) {
        failureMessage = this.exception;
      } else {
        failureMessage = this.toString(isomorphic, correctionLevel);
      }

      testCase.children.push({
        name: 'failure',
        attrs: {
          message: 'failure',
        },
        children: jsontoxml.escape(failureMessage),
      });
    }
    return testCase;
  }
}

export class AggregatedResults {
  suites: { [suite: string]: TestCounts } = {};
  results: Result[] = [];
  passCount = 0;
  failCount = 0;
  statistics = new StatisticsAggregator();
  correctionLevel: CorrectionLevel = CorrectionLevel.Scoped;

  recordResult(result: Result): void {
    const test = result.test;
    const passed = result.passed;

    // Update pass/run counts for each suite associated with this test.
    for (const suite of test.suites) {
      if (!(suite in this.suites)) {
        this.suites[suite] = { passCount: 0, runCount: 0 };
      }
      const counts = this.suites[suite];
      counts.runCount++;
      if (passed) {
        counts.passCount++;
      }
    }

    this.results.push(result);

    if (passed) {
      this.passCount++;
    } else {
      this.failCount++;
    }

    this.statistics.record(result.latencyMS);
  }

  toString(showPassedCases = false, isomorphic = false) {
    let stringValue = '';
    if (this.results.find((result) => !result.passed)) {
      if (showPassedCases) {
        stringValue += 'Passing and failing tests:\n';
      } else {
        stringValue += 'Failing tests:\n';
      }
    } else {
      stringValue += 'All tests passed.\n\n';
    }

    for (const result of this.results) {
      if (!result.passed || showPassedCases) {
        stringValue += result.toString(isomorphic, this.correctionLevel);
        stringValue += '\n';
      }
    }

    stringValue += 'Suites:\n';
    const suites = [...Object.entries(this.suites)].sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    for (const [suite, counts] of suites) {
      const rate = (counts.passCount / counts.runCount).toFixed(3);
      stringValue += `  ${suite}: ${counts.passCount}/${counts.runCount} (${rate})\n`;
    }
    stringValue += '\n';

    const rate = (this.passCount / this.results.length).toFixed(3);
    stringValue += `Overall: ${this.passCount}/${this.results.length} (${rate})\n`;
    stringValue += '\n';

    stringValue += `Failed: ${this.failCount}\n`;

    return stringValue;
  }

  print(showPassedCases = false, isomorphic = false) {
    console.log(this.toString(showPassedCases, isomorphic));
    console.log();
    this.printLatencyStatistics();
  }

  toJUnitXml(): string {
    const output = { testsuites: [] as XmlNode[] };

    output.testsuites = Object.keys(this.suites).map((suite) => ({
      name: 'testsuite',
      attrs: {
        name: suite,
      },
      children: this.results
        .filter((r) => r.test.suites.includes(suite))
        .map((r) => r.toJUnitXml(false, this.correctionLevel)),
    }));

    return jsontoxml(output, {
      indent: ' ',
      prettyPrint: true,
      xmlHeader: true,
    });
  }

  printLatencyStatistics() {
    const summary = this.statistics.computeStatistics([
      0.5, 0.9, 0.95, 0.99, 0.999,
    ]);
    if (summary) {
      printStatistics('Latency', 'ms', summary);
    }
  }

  rebase(): YamlTestCases {
    return this.results.map((result) => result.rebase());
  }
}

function getDifferencesText(observed: TestOrder, expected: TestStep): string {
  const o = observed.cart;
  const e = expected.cart;
  const n = Math.max(o.length, e.length);

  let differencesText = '';
  for (let i = 0; i < n; ++i) {
    const ovalue = i < o.length ? formatLine(o[i]) : 'BLANK';
    const evalue = i < e.length ? formatLine(e[i]) : 'BLANK';
    const equality = ovalue === evalue ? '===' : '!==';
    const ok = ovalue === evalue ? 'OK' : '<=== ERROR';
    differencesText += `    "${evalue}" ${equality} "${ovalue}" - ${ok}\n`;
  }
  return differencesText;
}

export function explainDifferences(observed: TestOrder, expected: TestStep) {
  console.log(getDifferencesText(observed, expected));
}

function formatLine(line: TestLineItem) {
  return `${line.indent}/${line.quantity}/${line.name}/${line.key}`;
}

///////////////////////////////////////////////////////////////////////////////
//
// TestCase
//
// Describes inputs and expected outputs for a single test.
// Runs a test, producting a Results object.
//
///////////////////////////////////////////////////////////////////////////////
export class TestCase {
  id: number;
  suites: string[];
  comment: string;
  steps: TestStep[];

  constructor(
    id: number,
    suites: string[],
    comment: string,
    steps: TestStep[]
  ) {
    this.id = id;
    this.suites = suites;
    this.comment = comment;
    this.steps = steps;
  }

  async run(
    processor: Processor,
    catalog: ICatalog,
    correctionLevel: CorrectionLevel,
    isomorphic = false,
    evaluateIntermediate = true
  ): Promise<Result> {
    const orders = [];
    let succeeded = true;
    let exception: string | undefined = undefined;

    let state: State = { cart: { items: [] } };

    // TODO: figure out how to remove the type assertion to any.
    // tslint:disable-next-line:no-any
    const start = (process.hrtime as any).bigint();

    try {
      for (const [i, step] of this.steps.entries()) {
        // Get input text based on scope
        const input = getYamlInputText(step, correctionLevel);

        // Run the parser
        state = await processor(input, state);

        // Convert the Cart to an Order
        const observed = testOrderFromCart(state.cart, catalog);
        orders.push(observed);

        if (
          succeeded &&
          (evaluateIntermediate || i === this.steps.length - 1)
        ) {
          // Compare observed Orders
          const expected = this.steps[i];
          succeeded = isomorphic
            ? ordersAreEqualCanonical(observed, expected)
            : ordersAreEqual(observed, expected);
        }
      }
    } catch (e) {
      succeeded = false;
      if (e instanceof Error) {
        exception = e.message;
      } else {
        exception = 'Unknown exception.';
      }
    }

    // TODO: figure out how to remove the type assertion to any.
    // tslint:disable-next-line:no-any
    const end = (process.hrtime as any).bigint();

    return new Result(
      this,
      orders,
      succeeded,
      exception,
      Number(end - start) / 1.0e6
    );
  }

  toJUnitXml() {
    return {
      name: 'testcase',
      attrs: {
        classname: this.suites,
        name: this.comment,
      },
    } as XmlNode;
  }
}

function ordersAreEqual(observed: TestOrder, expected: TestStep): boolean {
  if (observed.cart.length !== expected.cart.length) {
    return false;
  }

  for (let i = 0; i < expected.cart.length; ++i) {
    const o = observed.cart[i];
    const e = expected.cart[i];

    if (
      o.indent !== e.indent ||
      o.quantity !== e.quantity ||
      o.key !== e.key ||
      o.name !== e.name
    ) {
      return false;
    }
  }

  return true;
}

///////////////////////////////////////////////////////////////////////////////
//
// Alternative implementation of ordersAreEqual that does an isomorphic tree
// compare.
//
///////////////////////////////////////////////////////////////////////////////
function formatLineCanonical(prefix: string, line: TestLineItem) {
  return `${prefix} / ${line.indent}:${line.quantity}:${line.name}:${line.key}`;
}

function canonicalize(order: TestOrder): string[] {
  let topLevelCounter = 0;
  let lastTopLevel = '';
  const canonical: string[] = [];

  for (const line of order.cart) {
    if (line.indent === 0) {
      lastTopLevel = formatLineCanonical(String(topLevelCounter), line);
      ++topLevelCounter;
      canonical.push(lastTopLevel);
    } else {
      const text = formatLineCanonical(lastTopLevel, line);
      canonical.push(text);
    }
  }

  canonical.sort();

  return canonical;
}

export function ordersAreEqualCanonical(
  expected: TestOrder,
  observed: TestOrder
) {
  if (observed.cart.length !== expected.cart.length) {
    return false;
  }

  const e = canonicalize(expected);
  const o = canonicalize(observed);

  let allok = true;

  for (let i = 0; i < o.length; ++i) {
    const ovalue = i < o.length ? o[i] : 'BLANK';
    const evalue = i < e.length ? e[i] : 'BLANK';
    const equality = ovalue === evalue ? '===' : '!==';
    const ok = ovalue === evalue ? 'OK' : '<=== ERROR';
    allok = allok && ovalue === evalue;
  }

  return allok;
}

function getDifferencesTextCanonical(expected: TestOrder, observed: TestStep) {
  const e = canonicalize(expected);
  const o = canonicalize(observed);

  let allok = true;
  let differencesText = '';
  for (let i = 0; i < o.length; ++i) {
    const ovalue = i < o.length ? o[i] : 'BLANK';
    const evalue = i < e.length ? e[i] : 'BLANK';
    const equality = ovalue === evalue ? '===' : '!==';
    const ok = ovalue === evalue ? 'OK' : '<=== ERROR';
    allok = allok && ovalue === evalue;
    differencesText += `    "${evalue}" ${equality} "${ovalue}" - ${ok}\n`;
  }

  return { differencesText, allok };
}

export function explainDifferencesCanonical(
  expected: TestOrder,
  observed: TestStep
) {
  const differences = getDifferencesTextCanonical(expected, observed);
  console.log(differences.differencesText);
  return differences.allok;
}

export function getYamlInputText(
  step: TestStep,
  correctionLevel: CorrectionLevel
): string {
  let text: string;
  switch (correctionLevel) {
    case CorrectionLevel.Raw:
      text = step.rawSTT;
      break;
    case CorrectionLevel.STT:
      text = step.correctedSTT || step.rawSTT;
      break;
    case CorrectionLevel.Scoped:
    default:
      // The default is to use the highest level of correction
      text = step.correctedScope || step.correctedSTT || step.rawSTT;
      break;
  }
  return text;
}

const correctionLevelToField: string[] = [
  'rawSTT',
  'correctedSTT',
  'correctedScope',
];

export function getCorrectLevelFields(level: CorrectionLevel) {
  return correctionLevelToField.slice(0, level + 1);
}

export function getCorrectionLevel(level: string): CorrectionLevel | undefined {
  if (level === 'raw') {
    return CorrectionLevel.Raw;
  } else if (level === 'stt') {
    return CorrectionLevel.STT;
  } else if (level === 'scoped') {
    return CorrectionLevel.Scoped;
  } else {
    return undefined;
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// TestSuite
//
// Reads a set of TestCase descriptions from a YAML string.
// Runs the set of TestCases and returns an AggregatedResults object with
// information about the run.
//
///////////////////////////////////////////////////////////////////////////////

// Type definition for use by typescript-json-schema.
export type YamlTestCases = YamlTestCase[];

export class TestSuite {
  readonly tests: TestCase[] = [];

  // typescript-json-schema tsconfig.json YamlTestCases --required
  static fromYamlString(yamlText: string) {
    const schemaForTestCases = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        Cart: {
          properties: {
            indent: {
              type: 'number',
            },
            quantity: {
              type: 'number',
            },
            key: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
          },
          required: ['indent', 'key', 'name', 'quantity'],
          type: 'object',
        },
        TestSteps: {
          properties: {
            rawSTT: {
              type: 'string',
            },
            correctedSTT: {
              type: 'string',
            },
            correctedScope: {
              type: 'string',
            },
            cart: {
              items: {
                $ref: '#/definitions/Cart',
              },
              type: 'array',
            },
          },
          required: ['rawSTT', 'cart'],
          type: 'object',
        },
        YamlTestCase: {
          properties: {
            suites: {
              type: 'string',
            },
            comment: {
              type: 'string',
            },
            steps: {
              items: {
                $ref: '#/definitions/TestSteps',
              },
              type: 'array',
            },
          },
          required: ['suites', 'comment', 'steps'],
          type: 'object',
        },
      },
      items: {
        $ref: '#/definitions/YamlTestCase',
      },
      type: 'array',
    };

    const ajv = new AJV({ jsonPointers: true });
    const validator = ajv.compile(schemaForTestCases);
    const yamlRoot = yaml.safeLoad(yamlText) as YamlTestCase[];

    if (!validator(yamlRoot)) {
      const message = 'yaml data does not conform to schema.';
      debug(message);
      debug(validator.errors);
      const output = betterAjvErrors(
        schemaForTestCases,
        yamlRoot,
        validator.errors,
        { format: 'cli', indent: 1 }
      );
      throw new YAMLValidationError(message, output || []);
    }

    const tests = yamlRoot.map((test, index) => {
      return new TestCase(
        index,
        test.suites.split(/\s+/),
        test.comment,
        test.steps
      );
    });

    return new TestSuite(tests);
  }

  // Generate a collection of yamlTestCase records from an array of input
  // lines, each of which provides the input to a test case. Uses the
  // observed output as the expected output.
  static async fromInputLines(
    processor: Processor,
    catalog: ICatalog,
    speechToTextSimulator: SpeechToTextSimulator,
    lines: string[],
    suites: string[],
    comment: string
  ): Promise<YamlTestCase[]> {
    // Generate a test case for each input line.
    // Use speechToTextFilter to clean up each input line.
    let counter = 0;
    const tests = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.length > 0) {
        const step: TestStep = {
          rawSTT: speechToTextSimulator(line),
          cart: [],
        };
        tests.push(new TestCase(counter++, suites, comment, [step]));
      }
    }

    // Create a TestSuite from the TestCases, and then run it to collect
    // the observed output.
    const suite = new TestSuite(tests);
    const results = await suite.run(processor, catalog, allSuites);

    // Generate a yamlTestCase from each Result, using the observed output
    // for the expected output.
    return results.rebase();
  }

  constructor(tests: TestCase[]) {
    this.tests = tests;
  }

  *filteredTests(suiteFilter: SuitePredicate): IterableIterator<TestCase> {
    for (const test of this.tests) {
      if (suiteFilter(test.suites)) {
        yield test;
      }
    }
  }

  async run(
    processor: Processor,
    catalog: ICatalog,
    suiteFilter: SuitePredicate,
    correctionLevel: CorrectionLevel = CorrectionLevel.Scoped,
    isomorphic = false,
    evaluateIntermediate = true
  ): Promise<AggregatedResults> {
    const aggregator = new AggregatedResults();
    aggregator.correctionLevel = correctionLevel;

    for (const test of this.filteredTests(suiteFilter)) {
      aggregator.recordResult(
        await test.run(
          processor,
          catalog,
          correctionLevel,
          isomorphic,
          evaluateIntermediate
        )
      );
    }

    return aggregator;
  }
}
