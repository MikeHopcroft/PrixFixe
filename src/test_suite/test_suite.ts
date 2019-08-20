import * as AJV from 'ajv';
import * as Debug from 'debug';
import * as jsontoxml from 'jsontoxml';
import * as yaml from 'js-yaml';

import { ICatalog, Key, Catalog } from '../catalog';
import { Processor, State } from '../processors';
import { testOrderFromCart } from '../repl';
import { YAMLValidationError } from '../utilities';

import { printStatistics, StatisticsAggregator } from './statistics_aggregator';
import { allSuites, SuitePredicate } from './suite_filter';

const debug = Debug('prix-fixe:TestSuite.fromYamlString');

interface XmlNode {
    name: string;
    // tslint:disable-next-line: no-any
    attrs: any;
    children?: XmlNode[] | string;
}

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

// Holds a single line of an TestOrder.
export interface TestLineItem {
    readonly indent: number;
    readonly quantity: number;
    readonly key: Key;
    readonly name: string;
}

// A simplified view of the Cart, suitable for test verification.
export interface TestOrder {
    readonly lines: TestLineItem[];
}

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
            priority: Number(t.priority),
            suites: suites.join(' '),
            comment: t.comment,
            inputs: t.inputs,
            expected: this.observed,
        };
    }

    toString(isomorphic = false) {
        let stringValue = '';
        const suites = this.test.suites.join(' ');
        const passFail = this.passed ? 'PASSED' : 'FAILED';
        const exception = this.exception ? ' *** EXCEPTION THROWN ***' : '';
        stringValue += `${this.test.id} - ${passFail}${exception}\n`;
        stringValue += `  Comment: ${this.test.comment}\n`;
        stringValue += `  Suites: ${suites}\n`;

        if (this.exception) {
            stringValue += `  Exception message: "${this.exception}"\n`;
            for (const [i, input] of this.test.inputs.entries()) {
                stringValue += `  Utterance ${i}: "${input}"\n`;
            }
        } else {
            const i = this.test.inputs;
            const o = this.observed;
            const e = this.test.expected;
            const limit = Math.min(i.length, o.length, e.length);

            for (let index = 0; index < limit; ++index) {
                const input = this.test.inputs[index];
                const observed = this.observed[index];
                const expected = this.test.expected[index];

                stringValue += `  Utterance ${index}: "${input}"\n`;

                if (isomorphic) {
                    stringValue += getDifferencesTextCanonical(
                        observed,
                        expected
                    );
                } else {
                    stringValue += getDifferencesText(observed, expected);
                }
            }

            if (i.length !== e.length) {
                stringValue += '\n';
                stringValue +=
                    '  ERROR: test has mismatched input and expected counts.\n';
                stringValue += `     inputs.length = ${i.length}\n`;
                stringValue += `     expected.length = ${e.length}\n`;
                stringValue += '\n';
            }
        }
        return stringValue;
    }

    toJUnitXml(isomorphic = false): XmlNode {
        const testCase = this.test.toJUnitXml();

        testCase.attrs.time = (this.latencyMS / 1.0e3).toFixed(3);
        if (!this.passed) {
            testCase.children = new Array<XmlNode>();
            let failureMessage = '';
            if (this.exception) {
                failureMessage = this.exception;
            } else {
                failureMessage = this.toString(isomorphic);
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

// Stores aggregations related to test runs by suite or priority.
export interface TestCounts {
    passCount: number;
    runCount: number;
}

export class AggregatedResults {
    priorities: { [priority: string]: TestCounts } = {};
    suites: { [suite: string]: TestCounts } = {};
    results: Result[] = [];
    passCount = 0;
    failCount = 0;
    statistics = new StatisticsAggregator();

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

        // Update pass/run counts for this test's priority.
        if (!(test.priority in this.priorities)) {
            this.priorities[test.priority] = { passCount: 0, runCount: 0 };
        }
        const counts = this.priorities[test.priority];
        counts.runCount++;
        if (passed) {
            counts.passCount++;
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
        if (this.results.find(result => !result.passed)) {
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
                stringValue += result.toString(isomorphic);
                stringValue += '\n';
            }
        }

        stringValue += 'Suites:\n';
        for (const [suite, counts] of Object.entries(this.suites)) {
            const rate = (counts.passCount / counts.runCount).toFixed(3);
            stringValue += `  ${suite}: ${counts.passCount}/${counts.runCount} (${rate})\n`;
        }
        stringValue += '\n';

        stringValue += 'Priorities:\n';
        for (const [priority, counts] of Object.entries(this.priorities)) {
            const rate = (counts.passCount / counts.runCount).toFixed(3);
            stringValue += `  ${priority}: ${counts.passCount}/${counts.runCount} (${rate})\n`;
        }
        stringValue += '\n';

        const rate = (this.passCount / this.results.length).toFixed(3);
        stringValue += `Overall: ${this.passCount}/${this.results.length} (${rate})\n`;

        return stringValue;
    }

    print(showPassedCases = false, isomorphic = false) {
        console.log(this.toString(showPassedCases, isomorphic));
        console.log();
        this.printLatencyStatistics();
    }

    toJUnitXml(): string {
        const output = { testsuites: [] as XmlNode[] };

        output.testsuites = Object.keys(this.suites).map(suite => ({
            name: 'testsuite',
            attrs: {
                name: suite,
            },
            children: this.results
                .filter(r => r.test.suites.includes(suite))
                .map(r => r.toJUnitXml()),
        }));

        return jsontoxml(output, {
            indent: ' ',
            prettyPrint: true,
            xmlHeader: true,
        });
    }

    printLatencyStatistics() {
        const summary = this.statistics.computeStatistics([
            0.5,
            0.9,
            0.95,
            0.99,
            0.999,
        ]);
        if (summary) {
            printStatistics('Latency', 'ms', summary);
        }
    }

    rebase(): YamlTestCases {
        return this.results.map(result => result.rebase());
    }
}

function getDifferencesText(observed: TestOrder, expected: TestOrder): string {
    const o = observed.lines;
    const e = expected.lines;
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

export function explainDifferences(observed: TestOrder, expected: TestOrder) {
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
    priority: string;
    suites: string[];
    comment: string;
    inputs: string[];
    expected: TestOrder[];

    constructor(
        id: number,
        priority: string,
        suites: string[],
        comment: string,
        inputs: string[],
        expected: TestOrder[]
    ) {
        this.id = id;
        this.priority = priority;
        this.suites = suites;
        this.comment = comment;
        this.inputs = inputs;
        this.expected = expected;

        if (this.inputs.length !== this.expected.length) {
            console.log(' ');
            console.log(
                `WARNING: test ${id} has mismatched input and expected counts.`
            );
            console.log(`  inputs.length = ${inputs.length}`);
            console.log(`  expected.length = ${expected.length}`);
            console.log(' ');
        }
    }

    async run(
        processor: Processor,
        catalog: ICatalog,
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
            for (const [i, input] of this.inputs.entries()) {
                // Run the parser
                state = await processor(input, state);

                // Convert the Cart to an Order
                const observed = testOrderFromCart(state.cart, catalog);
                orders.push(observed);

                if (
                    succeeded &&
                    (evaluateIntermediate || i === this.inputs.length - 1)
                ) {
                    // Compare observed Orders
                    const expected = this.expected[i];
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

        // We can never succeed if the test is not constructed with the same
        // number of inputs as outputs.
        if (this.inputs.length !== this.expected.length) {
            succeeded = false;
        }

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

function ordersAreEqual(observed: TestOrder, expected: TestOrder): boolean {
    if (observed.lines.length !== expected.lines.length) {
        return false;
    }

    for (let i = 0; i < expected.lines.length; ++i) {
        const o = observed.lines[i];
        const e = expected.lines[i];

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

    for (const line of order.lines) {
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
    if (observed.lines.length !== expected.lines.length) {
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

function getDifferencesTextCanonical(expected: TestOrder, observed: TestOrder) {
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
    observed: TestOrder
) {
    const differences = getDifferencesTextCanonical(expected, observed);
    console.log(differences.differencesText);
    return differences.allok;
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

export interface YamlTestCase {
    priority: number;
    suites: string;
    comment: string;
    inputs: string[];
    expected: TestOrder[];
}

// Type definition for use by typescript-json-schema.
export type YamlTestCases = YamlTestCase[];

export class TestSuite {
    readonly tests: TestCase[] = [];

    // typescript-json-schema tsconfig.json YamlTestCases --required
    static fromYamlString(yamlText: string) {
        const schemaForTestCases = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            definitions: {
                LineItem2: {
                    properties: {
                        indent: {
                            type: 'number',
                        },
                        key: {
                            type: 'string',
                        },
                        name: {
                            type: 'string',
                        },
                        quantity: {
                            type: 'number',
                        },
                    },
                    required: ['indent', 'key', 'name', 'quantity'],
                    type: 'object',
                },
                Order: {
                    properties: {
                        lines: {
                            items: {
                                $ref: '#/definitions/LineItem2',
                            },
                            type: 'array',
                        },
                    },
                    required: ['lines'],
                    type: 'object',
                },
                YamlTestCase: {
                    properties: {
                        comment: {
                            type: 'string',
                        },
                        expected: {
                            items: {
                                $ref: '#/definitions/Order',
                            },
                            type: 'array',
                        },
                        inputs: {
                            items: {
                                type: 'string',
                            },
                            type: 'array',
                        },
                        priority: {
                            type: 'number',
                        },
                        suites: {
                            type: 'string',
                        },
                    },
                    required: [
                        'comment',
                        'expected',
                        'inputs',
                        'priority',
                        'suites',
                    ],
                    type: 'object',
                },
            },
            items: {
                $ref: '#/definitions/YamlTestCase',
            },
            type: 'array',
        };

        const ajv = new AJV();
        const validator = ajv.compile(schemaForTestCases);
        const yamlRoot = yaml.safeLoad(yamlText) as YamlTestCase[];

        if (!validator(yamlRoot)) {
            const message =
                'itemMapFromYamlString: yaml data does not conform to schema.';
            debug(message);
            debug(validator.errors);
            throw YAMLValidationError(message, validator.errors);
        }

        const tests = yamlRoot.map((test, index) => {
            return new TestCase(
                index,
                test.priority.toString(),
                test.suites.split(/\s+/),
                test.comment,
                test.inputs,
                test.expected
            );
        });

        return new TestSuite(tests);
    }

    // Generate a collection of yamlTestCase records from an array of input
    // lines, each of which provides the input to a test case. Uses the
    // observed output as the expected output.
    static async fromInputLines(
        processor: Processor,
        catalog: Catalog,
        speechToTextSimulator: SpeechToTextSimulator,
        lines: string[],
        priority: number,
        suites: string[]
    ): Promise<YamlTestCase[]> {
        const emptyOrder: TestOrder = { lines: [] };

        // Generate a test case for each input line.
        // Use speechToTextFilter to clean up each input line.
        let counter = 0;
        const tests = [];
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (line.length > 0) {
                tests.push(
                    new TestCase(
                        counter++,
                        priority.toString(),
                        suites,
                        '',
                        [speechToTextSimulator(line)],
                        [emptyOrder]
                    )
                );
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
        isomorphic = false,
        evaluateIntermediate = true
    ): Promise<AggregatedResults> {
        const aggregator = new AggregatedResults();

        for (const test of this.filteredTests(suiteFilter)) {
            aggregator.recordResult(
                await test.run(
                    processor,
                    catalog,
                    isomorphic,
                    evaluateIntermediate
                )
            );
        }

        return aggregator;
    }
}
