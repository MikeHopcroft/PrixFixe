import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';

import { createWorld, Processor, ProcessorFactory, World } from '../processors';

import { TestSuite } from './test_suite';

export async function testRunnerMain(
    title: string,
    processorFactory: ProcessorFactory,
    world: World | undefined = undefined
) {
    dotenv.config();

    console.log(`${title} test runner`);
    console.log(new Date().toLocaleString());

    const args = minimist(process.argv.slice(2));

    if (args._.length !== 1) {
        const message = 'Expected YAML input file on command line.';
        fail(message, true, processorFactory);
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
        fail(message, false, processorFactory);

        // NOTE: fail() terminates the program. The unreachable return
        // statement allows type system to know dataPath as string instead of
        // string | undefined.
        return;
    }
    console.log(`data path = ${dataPath}`);

    const verify = args['v'];

    if (args.h || args.help || args['?']) {
        showUsage(processorFactory);
        process.exit(0);
    }

    const showAll = args['a'] === true;

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

    // TODO: -n=<n> parameter

    //
    // Set up short-order processor
    //
    if (!world) {
        world = createWorld(dataPath);
    }

    if (processorFactory.count() === 0) {
        const message = `ProcessorFactory must contain at least one ProcessorDescription.`;
        fail(message, false, processorFactory);
        return;
    }

    // TODO: cleanup this code.
    let processor: Processor;
    if (verify) {
        if (!processorFactory.has(verify)) {
            const message = `Unknown processor v=${verify}`;
            fail(message, false, processorFactory);
        }
        processor = processorFactory.get(verify, world, dataPath);
        console.log(`processor = ${verify}`);
    } else {
        const description = processorFactory.defaultProcessorDescription();
        processor = description.factory(world, dataPath);
        console.log(`processor = ${description.name}`);
    }

    console.log(' ');

    //
    // Run the tests
    //
    const suiteFilter = args['s'];
    if (suiteFilter) {
        console.log(`Running tests in suite: ${suiteFilter}`);
    } else {
        console.log('Running all tests.');
    }

    const suite = TestSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    const aggregator = await suite.run(
        processor,
        world.catalog,
        suiteFilter,
        isomorphic,
        !skipIntermediate
    );
    aggregator.print(showAll);

    console.log('');
    console.log('');

    // TODO: implement aggregator.failCount
    // TODO: implement aggregateo.testCount
    // TODO: print out verdict message here
    if (aggregator.passCount < aggregator.results.length) {
        // At least one test failed, so exit with an error.
        process.exit(1);
    }
}

// TODO: consider making the runner a class so that we don't have to pass processorFactory around.
function fail(
    message: string,
    showHelp: boolean,
    processorFactory: ProcessorFactory
) {
    console.log(message);
    console.log('Aborting');
    console.log();
    if (showHelp) {
        showUsage(processorFactory);
    }
    process.exit(1);
}

function showUsage(processorFactory: ProcessorFactory) {
    const program = path.basename(process.argv[1]);

    console.log('Run test cases from YAML file');
    console.log('');
    console.log('This utility uses the short-order parser to run test cases');
    console.log('from an YAML input file.');
    console.log('');
    console.log(
        `Usage: node ${program} <input> [-a] [-i] [-n=N] [-v=processor] [-s=suite] [-x] [-d datapath] [-h|help|?]`
    );
    console.log('');
    console.log('<input>         Path to a file of YAML test cases.');
    console.log('');
    console.log(
        '-a              Print results for all tests, passing and failing.'
    );
    console.log('-i              Perform isomorphic tree comparison on carts.');
    console.log('-n <N>          Run only the Nth test.');
    // TODO: get default processor name from factory.
    // TODO: deal with no default processor available.
    console.log(
        '-v <processor>  Run the generated cases with the specified processor.'
    );
    console.log('-x              Do not verify intermediate results.');
    console.log('-d <datapath>   Path to prix-fixe data files.');
    console.log('                    attributes.yaml');
    console.log('                    intents.yaml');
    console.log('                    options.yaml');
    console.log('                    products.yaml');
    console.log('                    quantifiers.yaml');
    console.log('                    rules.yaml');
    console.log('                    stopwords.yaml');
    console.log('                    units.yaml');
    console.log('                The -d flag overrides the value specified');
    console.log('                in the PRIX_FIXE_DATA environment variable.');
    console.log('-h|help|?       Show this message.');
    console.log('-s suite        Run tests in specified suite.');
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
