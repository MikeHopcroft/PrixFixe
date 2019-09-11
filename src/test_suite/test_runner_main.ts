import chalk from "chalk";
import * as commandLineUsage from "command-line-usage";
import { Section } from "command-line-usage";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as recursiveReaddir from "recursive-readdir";

import { createWorld, Processor, World } from '../processors';

import { createMarkdown } from './print_markdown';
import { TestProcessors } from './test_processors';
import { AggregatedResults, TestSuite, getYamlInputText } from './test_suite';
import { allSuites, suiteFilter } from './suite_filter';
import { CorrectionLevel } from './interfaces';

let defaultProcessor;
export async function testRunnerMain(
    title: string,
    processorFactory: TestProcessors,
    world: World | undefined = undefined
) {
    dotenv.config();
    let testFiles: string[];
    const cwd = process.cwd();

    console.log(`${title} test runner`);
    console.log(new Date().toLocaleString());

    const args = minimist(process.argv.slice(2));

    // NOTE: must check for help before other flags as an error related to a
    // flag value might cause an early fail that would prevent showing the
    // help message.
    if (args.h || args.help || args['?']) {
        console.log(commandLineUsage(usage));
        defaultProcessor = processorFactory.getDefault().name;
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
        process.exit(0);
    }

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }
    if (dataPath === undefined) {
        const message =
            'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
        fail(message);

        // NOTE: fail() terminates the program. The unreachable return
        // statement allows type system to know dataPath as string instead of
        // string | undefined.
        return;
    }
    console.log(`data path = ${dataPath}`);

    const verify = args['v'];

    const showAll = args['a'] === true;
    const brief = args['b'] === true;
    const markdown = args['m'] === true;

    const testFile = args['f'];
    const dir = args['p'];
    const recursive = args['r'] === true;
    if (dir) {
        console.log(`test dir = ${dir}`);
        const testDirectory = path.resolve(cwd, dir).replace(/\"+$/, "");

        let files;
        if (recursive) {
            files = await recursiveReaddir(testDirectory);

            // NOTE: we sort here because want to always process the files in a consistent order and recursiveReaddir does not promise any consistency
            files = files.sort();
        } else {
            files = fs.readdirSync(testDirectory);
        }
        testFiles = files.filter((f) => f.endsWith("yaml")).map((f) => path.resolve(testDirectory, f));
    } else {
        if (!testFile) {
            const message = 'Expected YAML input file or directory on command line.';
            fail(message);
        }
        const testFileFullPath = path.resolve(cwd, testFile);
        testFiles = [testFileFullPath];
        console.log(`test file = ${testFile}`);
    }

    const correctionLevelFlag = args['t'];
    let correctionLevel = CorrectionLevel.Scoped;
    const correctionLevelMap = new Map<string, CorrectionLevel>();
    correctionLevelMap.set('raw', CorrectionLevel.Raw);
    correctionLevelMap.set('stt', CorrectionLevel.STT);
    correctionLevelMap.set('scoped', CorrectionLevel.Scoped);
    if (correctionLevelFlag) {
        correctionLevel =
            correctionLevelMap.get(correctionLevelFlag.toLowerCase()) ||
            CorrectionLevel.Scoped;
        console.log(`Correction Level: ${correctionLevel}.`);
        console.log(
            `       This test will use the ${correctionLevel} field for each step in the yaml as the utterance text input.`
        );
        console.log(
            `       The default will use the highest level of correction value provided in the yaml test file (run the help [-h] command to learn more).`
        );
    }

    const skipIntermediate = args['x'] === true;
    if (skipIntermediate) {
        console.log(
            'Intermediate steps in multi-line tests will not be verified.'
        );
    }

    const isomorphic = args['i'] === true;
    if (isomorphic) {
        console.log('Using isomorphic tree comparison in cart.');
    }

    let runOneTest: number | undefined = undefined;
    if (args['n'] !== undefined) {
        const n = Number(args['n']);
        if (!Number.isNaN(n)) {
            runOneTest = Number(n);
        } else {
            const message = 'Expected test number after -n flag.';
            fail(message);
        }
    }

    //
    // Set up short-order processor
    //
    if (!world) {
        try {
            world = createWorld(dataPath);
        } catch (err) {
            if (err.code === 'ENOENT' || err.code === 'EISDIR') {
                const message = `Create world failed: cannot open "${err.path}"`;
                fail(message);
                // Unreachable code for type assertion.
                world = undefined!;
            } else {
                throw err;
            }
        }
    }

    if (processorFactory.count() === 0) {
        const message = `ProcessorFactory must contain at least one ProcessorDescription.`;
        fail(message);
        return;
    }

    let processor: Processor;
    if (verify) {
        if (!processorFactory.has(verify)) {
            const message = `Unknown processor v=${verify}`;
            fail(message);
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
            `Running tests in matching suite expression: ${suiteExpressionText}`
        );
        suiteExpression = suiteFilter(suiteExpressionText);
    } else {
        console.log('Running all tests.');
    }


    const testSuites: TestSuite[] = [];
    const allResults = new AggregatedResults();

    for (const testFile of testFiles) {
        let suite: TestSuite;
        try {
            suite = TestSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
        } catch (err) {
            if (err.code === 'ENOENT' || err.code === 'EISDIR') {
                const message = `Cannot open test file "${err.path}"`;
                fail(message);
                // Unreachable code exists for type assertion.
                suite = undefined!;
            } else {
                throw err;
            }
        }

        if (runOneTest !== undefined) {
            if (runOneTest >= 0 && runOneTest < suite.tests.length) {
                suite = new TestSuite([suite.tests[runOneTest]]);
            } else {
                const message = `Invalid test number ${runOneTest}`;
                fail(message);
            }
        }

        testSuites.push(suite);
    }

    if (brief) {
        console.log(' ');
        console.log('Displaying test utterances without running.');
        testSuites.forEach((suite) => {
            for (const test of suite.filteredTests(suiteExpression)) {
                console.log(`Test ${test.id}: ${test.comment}`);
                for (const step of test.steps) {
                    const input = getYamlInputText(step, correctionLevel);
                    console.log(`  ${input}`);
                }
                console.log(' ');
            }
        });
        console.log('Tests not run.');
        console.log('Exiting with failing return code.');
        process.exit(1);
    } else {
        for (let i = 0; i < testSuites.length; i++) {
            const suiteResults = await testSuites[i].run(
                processor,
                world.catalog,
                suiteExpression,
                correctionLevel,
                isomorphic,
                !skipIntermediate
            );

            // If there are no results, explicitly call that out
            if (suiteResults.results.length === 0) {
                console.log(chalk`{yellow No test results. Possibly filtered out by specified run criteria.}`);
                continue;
            }
            else {
                console.log("---------------------------");
                if (markdown) {
                    const md = createMarkdown(suiteResults);
                    console.log(md);
                } else {
                    suiteResults.print(showAll);
                }
                console.log("---------------------------");

                console.log('');
                console.log('');

                suiteResults.results.forEach((r) => allResults.recordResult(r));
            }


        }

        const testPassRate = allResults.passCount / (allResults.passCount + allResults.failCount) * 100;

        console.log();
        console.log("============================");
        console.log(`OVERALL RESULTS: ${allResults.passCount}/${allResults.results.length}`);
        console.log(chalk`${allResults.results.length.toString()} tests run; {yellow.bold ${testPassRate.toString()}%} pass rate.`);
        console.log("============================");
        process.exit(0);
    }
}

const usage: Section[] = [
    {
        header: "Test Runner",
        content: `This utility allows the user to run text utterances to verify intermediate and final cart states using a YAML test case file.`,
    },
    {
        header: "Options",
        optionList: [
            {
                name: "f",
                alias: "f",
                typeLabel: "{underline filePath}",
                description: "YAML test file to run.",
            },
            {
                name: "p",
                alias: "p",
                typeLabel: "{underline directoryPath}",
                description: "Directory to inspect and run all YAML files (non-recursive by default). Mutually exclusive with {bold -f}",
            },
            {
                name: "r",
                alias: "r",
                description: "When doing a directory scan, recurse through child directories",
                type: Boolean,
            },
            {
                name: "s",
                alias: "s",
                typeLabel: "{underline suiteFilter}",
                description: "Suites (specified in test YAML) to run",
            },
            {
                name: "s",
                alias: "i",
                type: Boolean,
                description: "Perform isomorphic tree comparison on carts. Relaxes cart matching to allow for items to be out of order.",
            },
            {
                name: "a",
                alias: "a",
                type: Boolean,
                description: "Print results for all tests, passing and failing.",
            },
            {
                name: "b",
                alias: "b",
                type: Boolean,
                description: "Just print utterances. Do not run tests.",
            },
            {
                name: "m",
                alias: "m",
                type: Boolean,
                description: "Print out test run, formatted as markdown.",
            },
            {
                name: "v",
                alias: "v",
                typeLabel: "{underline processor}",
                description: `Run the generated cases with the specified processor\n(default is -v=${defaultProcessor}).`,
            },
            {
                name: "n",
                alias: "n",
                typeLabel: "{underline N}",
                description: "Run only the Nth test.",
            },
            {
                name: "x",
                alias: "x",
                type: Boolean,
                description: "Validate final cart state only, do not verify intermediate results.",
            },
            {
                name: "d",
                alias: "d",
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
            {
                name: "t",
                alias: "t",
                typeLabel: "{underline < raw | stt | scoped >}",
                description: `Run tests using specified utterance field. The default is SCOPED and will use the highest corrected value provided in the yaml.\n
                {bold RAW}: force it to run on the original input, even if there are corrected versions available\n
                {bold STT}: if there is correctedSTT available use that otherwise use input, even if there is correctedScope available\n
                {bold SCOPED}: if there is correctedScope available use it, other wise fall back to correctedSTT and then input`,
            },
        ],
    },
];

function fail(message: string) {
    console.log(' ');
    console.log(message);
    console.log('Use the -h flag for help.');
    console.log(' ');
    console.log('Aborting');
    console.log(' ');
    process.exit(1);
}
