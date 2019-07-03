import * as AJV from 'ajv';
import * as Debug from 'debug';
import * as yaml from 'js-yaml';

import { ICatalog, Key, Catalog } from '../catalog';
import { Cart, ItemInstance } from '../cart';

import { printStatistics, StatisticsAggregator } from './statistics_aggregator';

const debug = Debug('prix-fixe:TestSuite.fromYamlString');

export interface State {
    cart: Cart;
}

export type SpeechToTextSimulator = (text: string) => string;
export type Processor = (text: string, state: State) => Promise<State>;

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
        }

        this.statistics.record(result.latencyMS);
    }

    print(showPassedCases = false) {
        if (this.results.find(result => !result.passed)) {
            console.log('Failing tests:');
        } else {
            console.log('All tests passed.');
            console.log();
        }

        for (const result of this.results) {
            if (!result.passed || showPassedCases) {
                const suites = result.test.suites.join(' ');
                const passFail = result.passed ? 'PASSED' : 'FAILED';
                const exception = result.exception
                    ? ' *** EXCEPTION THROWN ***'
                    : '';
                console.log(`${result.test.id} - ${passFail}${exception}`);
                console.log(`  Comment: ${result.test.comment}`);
                console.log(`  Suites: ${suites}`);

                if (result.exception) {
                    console.log(`  Exception message: "${result.exception}"`);
                } else {
                    for (const [i, input] of result.test.inputs.entries()) {
                        const observed = result.observed[i];
                        const expected = result.test.expected[i];

                        console.log(
                            `  Utterance ${i}: "${result.test.inputs[i]}"`
                        );

                        explainDifferences(observed, expected);
                    }
                }
                console.log();
            }
        }

        console.log('Suites:');
        for (const [suite, counts] of Object.entries(this.suites)) {
            console.log(`  ${suite}: ${counts.passCount}/${counts.runCount}`);
        }
        console.log();

        console.log('Priorities:');
        for (const [priority, counts] of Object.entries(this.priorities)) {
            console.log(
                `  ${priority}: ${counts.passCount}/${counts.runCount}`
            );
        }
        console.log();

        console.log(`Overall: ${this.passCount}/${this.results.length}`);

        console.log();
        this.printLatencyStatistics();
    }

    printLatencyStatistics() {
        const summary = this.statistics.computeStatistics([
            0.5,
            0.9,
            0.95,
            0.99,
            0.999,
        ]);
        printStatistics('Latency', 'ms', summary);
    }

    rebase(): YamlTestCases {
        return this.results.map(result => result.rebase());
    }
}

export function explainDifferences(observed: TestOrder, expected: TestOrder) {
    const o = observed.lines;
    const e = expected.lines;
    const n = Math.max(o.length, e.length);

    for (let i = 0; i < n; ++i) {
        const ovalue = i < o.length ? formatLine(o[i]) : 'BLANK';
        const evalue = i < e.length ? formatLine(e[i]) : 'BLANK';
        const equality = ovalue === evalue ? '===' : '!==';
        const ok = ovalue === evalue ? 'OK' : '<=== ERROR';
        console.log(`    "${evalue}" ${equality} "${ovalue}" - ${ok}`);
    }
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
    }

    async run(processor: Processor, catalog: ICatalog): Promise<Result> {
        const orders = [];
        let succeeded = true;
        let exception: string | undefined = undefined;

        let state: State = { cart: { items: [] } };

        const start = process.hrtime.bigint();

        try {
            for (const [i, input] of this.inputs.entries()) {
                // Run the parser
                state = await processor(input, state);

                // Convert the Cart to an Order
                const observed = formatCart(state.cart, catalog);
                orders.push(observed);

                // Compare observed Orders
                const expected = this.expected[i];
                succeeded = ordersAreEqual(observed, expected);
            }
        } catch (e) {
            succeeded = false;
            if (e instanceof Error) {
                exception = e.message;
            } else {
                exception = 'Unknown exception.';
            }
        }

        const end = process.hrtime.bigint();

        return new Result(
            this,
            orders,
            succeeded,
            exception,
            Number(end - start) / 10e6
        );
    }
}

function formatCart(cart: Cart, catalog: ICatalog): TestOrder {
    const lines: TestLineItem[] = [];

    for (const item of cart.items) {
        formatItem(catalog, lines, item, 0);
    }

    return { lines };
}

function formatItem(
    catalog: ICatalog,
    order: TestLineItem[],
    item: ItemInstance,
    indent: number
): void {
    let name: string;
    if (catalog.hasKey(item.key)) {
        name = catalog.getSpecific(item.key).name;
    } else {
        name = `UNKNOWN(${item.key})`;
    }
    const quantity = item.quantity;
    const key = item.key;

    order.push({ indent, quantity, key, name });

    for (const child of item.children) {
        formatItem(catalog, order, child, indent + 1);
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
            throw TypeError(message);
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
        const results = await suite.run(processor, catalog, false, undefined);

        // Generate a yamlTestCase from each Result, using the observed output
        // for the expected output.
        return results.rebase();
    }

    constructor(tests: TestCase[]) {
        this.tests = tests;
    }

    async run(
        processor: Processor,
        catalog: ICatalog,
        showPassedCases = false,
        suite: string | undefined = undefined
    ): Promise<AggregatedResults> {
        const aggregator = new AggregatedResults();

        for (const test of this.tests) {
            if ((suite && test.suites.indexOf(suite) > -1) || !suite) {
                aggregator.recordResult(await test.run(processor, catalog));
            }
        }

        aggregator.print(showPassedCases);

        return aggregator;
    }
}
