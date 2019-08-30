import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';

import { createWorld, Processor, World } from '../processors';

import { createMarkdown } from './print_markdown';
import { TestProcessors } from './test_processors';
import { TestSuite, getYamlInputText } from './test_suite';
import { allSuites, suiteFilter } from './suite_filter';
import { CorrectionLevel } from './interfaces';

export async function testRunnerMain(
    title: string,
    processorFactory: TestProcessors,
    world: World | undefined = undefined
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

    if (args._.length === 0) {
        const message = 'Expected YAML input file on command line.';
        fail(message);
    } else if (args._.length > 1) {
        const message = 'Found extra arguments on command line.';
        fail(message);
    }

    const testFile = args._[0];
    console.log(`test file = ${testFile}`);

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
    if (brief) {
        console.log(' ');
        console.log('Displaying test utterances without running.');
        for (const test of suite.filteredTests(suiteExpression)) {
            console.log(`Test ${test.id}: ${test.comment}`);
            for (const step of test.steps) {
                const input = getYamlInputText(step, correctionLevel);
                console.log(`  ${input}`);
            }
            console.log(' ');
        }
        console.log('Tests not run.');
        console.log('Exiting with failing return code.');
        process.exit(1);
    } else {
        const aggregator = await suite.run(
            processor,
            world.catalog,
            suiteExpression,
            correctionLevel,
            isomorphic,
            !skipIntermediate
        );

        if (markdown) {
            const md = createMarkdown(aggregator);
            console.log(md);
        } else {
            aggregator.print(showAll);
        }

        console.log('');
        console.log('');

        if (
            aggregator.failCount > 0 ||
            aggregator.passCount < aggregator.results.length
        ) {
            // At least one test failed, so exit with an error.
            console.log(`${aggregator.failCount} tests failed.`);
            console.log('Exiting with failing return code.');
            process.exit(1);
        } else {
            console.log(`${aggregator.passCount} tests passed.`);
            console.log('Exiting with successful return code.');
            process.exit(0);
        }
    }
}

function showUsage(processorFactory: TestProcessors) {
    const program = path.basename(process.argv[1]);
    const defaultProcessor = processorFactory.getDefault().name;

    console.log('Run test cases from YAML file');
    console.log('');
    console.log('This utility uses the short-order parser to run test cases');
    console.log('from an YAML input file.');
    console.log('');
    console.log(
        `Usage: node ${program} <input> [-a] [-i] [-n=N] [-v=processor] [-s=suite] [-x] [-d datapath] [-h|help|?] [-t utterance field]`
    );
    console.log('');
    console.log('<input>         Path to a file of YAML test cases.');
    console.log('');
    console.log(
        '-a              Print results for all tests, passing and failing.'
    );
    console.log('-b              Just print utterances. Do not run tests.');
    console.log('-m              Print out test run, formatted as markdown.');
    console.log('-i              Perform isomorphic tree comparison on carts.');
    console.log('-n <N>          Run only the Nth test.');
    // TODO: get default processor name from factory.
    // TODO: deal with no default processor available.
    console.log(
        '-v <processor>  Run the generated cases with the specified processor.'
    );
    console.log(`                       (default is -v=${defaultProcessor}).`);
    console.log('-x                     Do not verify intermediate results.');
    console.log('-d <datapath>          Path to prix-fixe data files.');
    console.log('                           attributes.yaml');
    console.log('                           intents.yaml');
    console.log('                           options.yaml');
    console.log('                           products.yaml');
    console.log('                           quantifiers.yaml');
    console.log('                           rules.yaml');
    console.log('                           stopwords.yaml');
    console.log('                           units.yaml');
    console.log(
        '                       The -d flag overrides the value specified'
    );
    console.log(
        '                       in the PRIX_FIXE_DATA environment variable.'
    );
    console.log('-h|help|?              Show this message.');
    console.log('-s suite               Run tests in specified suite.');
    console.log(
        '-t <raw|stt|scoped>  Run tests using specified utterance field. RAW | STT | SCOPED'
    );
    console.log(
        '                           The default is SCOPED and will use the highest corrected value provided in the yaml.'
    );
    console.log(
        '                           RAW: force it to run on the original input, even if there are corrected versions available'
    );
    console.log(
        '                             STT: if there is correctedSTT available use that otherwise use input, even if there is correctedScope available'
    );
    console.log(
        '                          SCOPED: if there is correctedScope available use it, other wise fall back to correctedSTT and then input'
    );
    console.log(' ');

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
