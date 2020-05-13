import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { safeDump } from 'js-yaml';
import * as minimist from 'minimist';
import * as path from 'path';
import * as recursiveReaddir from 'recursive-readdir';

import { createWorld2 } from '../authoring/world';
import { createWorld, Processor, State, World } from '../processors';

// import { createMarkdown } from './print_markdown';
import { allSuites, suitePredicate } from '../test_suite/suite_predicate';
import { TestProcessors } from '../test_suite/test_processors';

import { printAggregateMeasures } from './aggregate';
import {
    enumerateTestCases,
    filterSuite,
    mapSuiteAsync,
    suitePredicateFilter
} from './filter';

import {
    AnyTurn,
    GenericCase,
    GenericSuite,
    LogicalValidationSuite,
    TextTurn,
    ValidationStep,
} from './interfaces';

import { loadLogicalValidationSuite } from './loaders';
import { logicalCartFromCart } from './logical_cart';
import { createMenuBasedRepairFunction } from './repair_functions';
import { scoreSuite } from './scoring';

// import {
//     TestCase,
//     TestSuite,
//     getYamlInputText,
//     getCorrectLevelFields,
//     getCorrectionLevel,
// } from './test_suite';

// import { verifyTestSuite } from './test_verifier';

export async function testRunnerMain2(
    title: string,
    processorFactory: TestProcessors
) {
    dotenv.config();

    console.log(`${title} test runner`);
    console.log(new Date().toLocaleString());

    const args = minimist(process.argv.slice(2));

    // NOTE: must check for help before other flags as an error related to a
    // flag value might cause an early fail that would prevent showing the
    // help message.
    if (args.h || args.help || args['?']) {
        showUsage(processorFactory);
        process.exit(0);
    }

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }
    if (dataPath === undefined) {
        const message =
            'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
        return fail(message);
    }
    console.log(`data path = ${dataPath}`);

    const verify = args['v'];

    const showAll = args['a'] === true;
    const brief = args['b'] === true;
    const markdown = args['m'] === true;

    const recursive = args['r'] === true;

    if (args._.length === 0) {
        const message =
            'Expected YAML input file or directory on command line.';
        return fail(message);
    } else if (args._.length > 1) {
        const message = 'Found extra arguments on command line.';
        return fail(message);
    }

    let testFiles: string[];
    const cwd = process.cwd();
    const input = path.resolve(cwd, args._[0]);
    if (fs.lstatSync(input).isDirectory()) {
        console.log(`test dir = ${input}`);

        let files;
        if (recursive) {
            files = await recursiveReaddir(input);
        } else {
            files = fs.readdirSync(input);
        }

        testFiles = files
            .sort()
            .filter(f => f.endsWith('yaml'))
            .map(f => path.resolve(input, f));
    } else {
        // Assume that input is a YAML test file.
        testFiles = [input];
        console.log(`test file = ${input}`);
    }

    const generate = args['g'];
    const outputPath = args['o'];

    // const correctionLevelFlag = args['c'] || 'scoped';
    // const correctionLevel = getCorrectionLevel(correctionLevelFlag);
    // if (correctionLevel === undefined) {
    //     const message = `Unsupported correction level "${correctionLevelFlag}"`;
    //     return fail(message);
    // }
    // console.log(`Correction Level: ${correctionLevelFlag}.`);
    // const fields = getCorrectLevelFields(correctionLevel).join(' ');
    // console.log(
    //     `  Tests will use the rightmost available field from [${fields}]`
    // );

    // const skipIntermediate = args['x'] === true;
    // if (skipIntermediate) {
    //     console.log(
    //         'Intermediate steps in multi-line tests will not be verified.'
    //     );
    // }

    // const isomorphic = args['i'] === true;
    // if (isomorphic) {
    //     console.log('Using isomorphic tree comparison in cart.');
    // }

    let runOneTest: number | undefined = undefined;
    if (args['n'] !== undefined) {
        const n = Number(args['n']);
        if (!Number.isNaN(n)) {
            runOneTest = Number(n);
        } else {
            const message = 'Expected test number after -n flag.';
            return fail(message);
        }
    }

    // const fixup = args['f'];

    //
    // Set up short-order processor
    //
    let world: World;
    try {
        world = createWorld2(dataPath);
    } catch (err) {
        if (err.code === 'ENOENT' || err.code === 'EISDIR') {
            const message = `Create world failed: cannot open "${err.path}"`;
            return fail(message);
        } else {
            throw err;
        }
    }

    if (processorFactory.count() === 0) {
        const message = `ProcessorFactory must contain at least one ProcessorDescription.`;
        return fail(message);
    }

    let processor: Processor;
    if (verify) {
        if (!processorFactory.has(verify)) {
            const message = `Unknown processor v=${verify}`;
            return fail(message);
        }
        processor = processorFactory.create(verify, world, dataPath);
        console.log(`processor = ${verify}`);
    } else {
        const description = processorFactory.getDefault();
        processor = description.create(world, dataPath);
        console.log(`processor = ${description.name}`);
    }

    console.log(' ');

    //
    // Run the tests
    //
    const suiteExpressionText = args['s'];
    let suiteExpression = allSuites;
    if (runOneTest !== undefined) {
        console.log(`Running test number ${runOneTest}.`);
    } else if (suiteExpressionText) {
        console.log(
            `Running tests matching suite expression: ${suiteExpressionText}`
        );
        suiteExpression = suitePredicate(suiteExpressionText);
    } else {
        console.log('Running all tests.');
    }

    //
    // Combine all test files into a single suite.
    //

    // First get all TestCases into a single array.
    // let suite: LogicalValidationSuite<AnyTurn> = {
    let suite: GenericSuite<ValidationStep<TextTurn>> = {
            comment: `Combined ${testFiles.join(', ')}`,
        tests: [],
    };
    for (const testFile of testFiles) {
        try {
            console.log(`Reading ${testFile}`);
            const s: LogicalValidationSuite<TextTurn> = 
                loadLogicalValidationSuite(testFile);
            // const yaml = fs.readFileSync(testFile, 'utf8');
            // const suite = TestSuite.fromYamlString(yaml);
            // verifyTestSuite(suite, world.catalog, world.ruleChecker);
            suite.tests.push(s);
        } catch (err) {
            if (err.code === 'ENOENT' || err.code === 'EISDIR') {
                const message = `Cannot open test file "${err.path}"`;
                return fail(message);
            } else {
                throw err;
            }
        }
    }

    // Renumber the TestCases
    let index = 0;
    let oneTest: GenericCase<ValidationStep<TextTurn>> | undefined;
    for (const test of enumerateTestCases(suite)) {
        if (runOneTest === index) {
            oneTest = test;
        }
        test.id = index++;
    }

    // for (const [index, test] of tests.entries()) {
    //     test.id = index;
    // }

    // Construct a TestSuite with all of the TestCases.
    // let suite = new TestSuite(tests);

    // Handle the scenario where the user wants to run the nth TestCase.
    if (oneTest) {
        suite = {
            comment: `Test ${oneTest.id}`,
            tests: [oneTest],
        };
    } else {
        suite = filterSuite(
            suite,
            suitePredicateFilter(suiteExpression)
        );
    }
    // if (runOneTest !== undefined) {
    //     if (runOneTest >= 0 && runOneTest < suite.tests.length) {
    //         suite = new TestSuite([suite.tests[runOneTest]]);
    //     } else {
    //         const message = `Invalid test number ${runOneTest}`;
    //         return fail(message);
    //     }
    // }

    if (brief) {
        // In brief mode, don't actually run the tests.
        // Just display the input text.
        console.log(' ');
        console.log('Displaying test utterances without running.');
        // for (const test of suite.filteredTests(suiteExpression)) {
        for (const test of enumerateTestCases(suite)) {
            console.log(`Test ${test.id}: ${test.comment}`);
            for (const step of test.steps) {
                // const input = getYamlInputText(step, correctionLevel);
                for (const turn of step.turns) {
                    console.log(`  ${turn.speaker}: ${turn.transcription}`);
                }
            }
            console.log(' ');
        }
        console.log('Tests not run.');
        console.log('Exiting with failing return code.');
        return succeed(false);
    // } else if (fixup) {
    //     console.log('Fixup completed.');
    } else {
        // Otherwise, run the tests.
        // const results = await suite.run(
        //     processor,
        //     world.catalog,
        //     suiteExpression,
        //     correctionLevel,
        //     isomorphic,
        //     !skipIntermediate
        // );
        const observed = await mapSuiteAsync(suite, async test => {
            let state: State = { cart: { items: [] } };
            const steps: typeof test.steps = [];
            for (const step of test.steps) {
                for (const turn of step.turns) {
                    state = await processor(
                        turn.transcription,
                        state
                    );
                }
                steps.push({
                    ...step,
                    cart: logicalCartFromCart(state.cart, world.catalog),
                });
            }
            return { ...test, steps };
        });

        console.log('---------------------------');
        const repairs = createMenuBasedRepairFunction(
            world.attributeInfo,
            world.catalog
        );
        const scored = scoreSuite(observed, suite, repairs, '');

        for (const test of enumerateTestCases(scored)) {
            console.log(`${test.id}: ${test.comment}`);
            for (const [index, step] of test.steps.entries()) {
                const { perfect, complete, repairs } = step.measures;
                console.log(
                    `  step ${index}: perfect: ${perfect}, complete: ${complete}, repairs: ${
                        repairs!.cost
                    }`
                );
                for (const edit of repairs!.steps) {
                    console.log(`    ${edit}`);
                }
            }
            console.log(' ');
        }

        // Print out summary.
        printAggregateMeasures(scored.measures);

        // if (markdown) {
        //     const md = createMarkdown(results);
        //     console.log(md);
        // } else {
        //     results.print(showAll);
        // }
        console.log('---------------------------');

        console.log('');
        console.log('');

        // if (generate) {
        //     const outfile = path.resolve(cwd, generate);
        //     console.log(`Rebasing test cases to ${outfile}.`);
        //     const newResults = results.rebase();
        //     await fs.writeFileSync(outfile, safeDump(newResults));
        // }

        // if (outputPath) {
        //     console.log(`Writing results to '${outputPath}'`);
        //     fs.writeFileSync(path.resolve(outputPath), results.toJUnitXml());
        // }

        return succeed(true);
    }
}

function showUsage(processorFactory: TestProcessors) {
    const defaultProcessor = processorFactory.getDefault().name;
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
        {
            header: 'Test Runner',
            content: `This utility allows the user to run text utterances to verify intermediate and final cart states using a YAML test case file.`,
        },
        {
            header: 'Usage',
            content: [
                `node ${program} <file|directory> [...options]`,
                '',
                `Where <file> is the name of a single YAML test file and <directory> is a directory of YAML test files.`,
            ],
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'r',
                    alias: 'r',
                    description:
                        'When doing a directory scan, recurse through child directories',
                    type: Boolean,
                },
                {
                    name: 's',
                    alias: 's',
                    typeLabel: '{underline suiteFilter}',
                    description:
                        'Boolean expression of suites to run.' +
                        'Can use suite names, !, &, |, and parentheses.' +
                        'Note that the -n flag overrides the -s flag.',
                },
                // {
                //     name: 's',
                //     alias: 'i',
                //     type: Boolean,
                //     description:
                //         'Perform isomorphic tree comparison on carts. Relaxes cart matching to allow for items to be out of order.',
                // },
                {
                    name: 'a',
                    alias: 'a',
                    type: Boolean,
                    description:
                        'Print results for all tests, passing and failing.',
                },
                {
                    name: 'b',
                    alias: 'b',
                    type: Boolean,
                    description: 'Just print utterances. Do not run tests.',
                },
                {
                    name: 'm',
                    alias: 'm',
                    type: Boolean,
                    description: 'Print out test run, formatted as markdown.',
                },
                {
                    name: 'v',
                    alias: 'v',
                    typeLabel: '{underline processor}',
                    description: `Run the generated cases with the specified processor\n(default is -v=${defaultProcessor}).`,
                },
                {
                    name: 'n',
                    alias: 'n',
                    typeLabel: '{underline N}',
                    description:
                        'Run only the Nth test.' +
                        'Note that the -n flag overrides the -s flag.',
                },
                // {
                //     name: 'x',
                //     alias: 'x',
                //     type: Boolean,
                //     description:
                //         'Validate final cart state only, do not verify intermediate results.',
                // },
                {
                    name: 'generate',
                    alias: 'g',
                    typeLabel: '{underline outputFilePath}',
                    description:
                        'Output file to save generated cart results. Not compatible with directories, single file only.',
                },
                {
                    name: 'output',
                    alias: 'o',
                    typeLabel: '{underline outputFilePath}',
                    description: 'Path to output results in JUnit format',
                },
                {
                    name: 'd',
                    alias: 'd',
                    description: `Path to prix-fixe data files.\n
                - attributes.yaml
                - intents.yaml
                - options.yaml
                - products.yaml
                - quantifiers.yaml
                - rules.yaml
                - stopwords.yaml
                - units.yaml\n
                The {bold -d} flag overrides the value specified in the {bold PRIX_FIXE_DATA} environment variable.\n`,
                    type: Boolean,
                },
                // {
                //     name: 'c',
                //     alias: 'c',
                //     typeLabel: '{underline < raw | stt | scoped >}',
                //     description: `Run tests using specified utterance field. The default is SCOPED and will use the highest corrected value provided in the yaml.\n
                // {bold RAW}: force it to run on the original input, even if there are corrected versions available\n
                // {bold STT}: if there is correctedSTT available use that otherwise use input, even if there is correctedScope available\n
                // {bold SCOPED}: if there is correctedScope available use it, other wise fall back to correctedSTT and then input`,
                // },
                {
                    name: 't',
                    alias: 't',
                    typeLabel: '{underline <snowball | metaphone | hybrid >}',
                    description: 'Reserved for short-order term model.',
                },
                {
                    name: 'f',
                    alias: 'f',
                    description: 'Attempt to fix rules errors.',
                },
            ],
        },
    ];

    console.log(commandLineUsage(usage));

    if (processorFactory.count() > 0) {
        console.log('Available Processors:');
        for (const processor of processorFactory.processors()) {
            console.log(`  "-v=${processor.name}": ${processor.description}`);
            // TODO: list expected data files for each processor.
        }
    } else {
        console.log('No Processors available.');
        console.log(
            'The supplied ProcessorFactory has no ProcessorDescriptions'
        );
    }
}

function fail(message: string) {
    console.log(' ');
    console.log(message);
    console.log('Use the -h flag for help.');
    console.log(' ');
    console.log('Aborting');
    console.log(' ');
    process.exit(1);
}

function succeed(succeeded: boolean) {
    if (succeeded) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}