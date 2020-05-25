import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';

import { createWorld } from '../processors';

import {
    createMenuBasedRepairFunction,
    createSimpleRepairFunction,
    fail,
    formatScoredSuite,
    handleError,
    loadLogicalValidationSuite,
    RepairFunction,
    scoreSuite,
    succeed,
    writeYAML,
    FormatScoredSuiteOptions,
} from '../test_suite2';

function main() {
    dotenv.config();

    const args = minimist(process.argv.slice(2));

    if (args.h || args.help) {
        showUsage();
        return succeed(false);
    }

    if (args._.length !== 3 && args._.length !== 2) {
        return fail('Error: expected two or three command line parameters.');
    }

    const expectedFile = args._[0];
    const observedFile = args._[1];
    const scoredFile = args._[2];

    let dataPath: string | undefined;

    if (!args.x) {
        dataPath = process.env.PRIX_FIXE_DATA;
        if (args.d) {
            dataPath = args.d;
        }
        if (dataPath === undefined) {
            const message =
                'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
            return fail(message);
        }
    }

    try {
        evaluate(
            expectedFile,
            observedFile,
            scoredFile,
            dataPath,
            args.v === true
        );
    } catch (e) {
        handleError(e);
    }
}

function evaluate(
    expectedFile: string,
    observedFile: string,
    ouputFile: string | undefined,
    dataPath: string | undefined,
    verbose: boolean
) {
    console.log('Comparing');
    console.log(`  expected validation suite: ${expectedFile}`);
    console.log(`  observed validation suite: ${observedFile}`);
    console.log(' ');

    if (dataPath) {
        console.log(`Computing repair cost with menu files from ${dataPath}.`);
    } else {
        console.log(`Using simple repair costs that don't require menu files.`);
    }
    console.log(' ');

    // Load the expected validation suite.
    const expectedSuite = loadLogicalValidationSuite(expectedFile);
    const observedSuite = loadLogicalValidationSuite(observedFile);

    let repairs: RepairFunction;
    let notes: string;

    if (dataPath) {
        // Load the world, which provides the AttributeInfo and ICatalog.
        const world = createWorld(dataPath);
        repairs = createMenuBasedRepairFunction(
            world.attributeInfo,
            world.catalog
        );
        notes = 'Menu-based repairs';
    } else {
        repairs = createSimpleRepairFunction();
        notes = 'Simple repairs';
    }

    const scoredSuite = scoreSuite(
        observedSuite,
        expectedSuite,
        repairs,
        notes
    );

    const options: FormatScoredSuiteOptions = {
        showPassing: false,
        showFailing: verbose,
        showBySuite: true,
        showMeasures: true,
    };

    const lines: string[] = [];
    formatScoredSuite(lines, scoredSuite, options);
    for (const line of lines) {
        console.log(line);
    }

    if (ouputFile) {
        console.log(`Writing scored suite to ${ouputFile}`);
        writeYAML(ouputFile, scoredSuite);
    }

    console.log('Scoring complete');
    console.log('');

    return succeed(true);
}

function showUsage() {
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
        {
            header: 'Suite evaluation tool',
            content: `This utility computes perfect cart, complete cart, and repair cost metrics.`,
        },
        {
            header: 'Usage',
            content: [
                `node ${program} <expected file> <observed file > [output file] [...options]`,
            ],
        },
        {
            header: 'Required Parameters',
            content: [
                {
                    name: '<expected file>',
                    summary:
                        'Path to a LogicalValidationSuite file with the expected carts.',
                },
                {
                    name: '<observed file>',
                    summary:
                        'Path to a LogicalValidationSuite file with the observed carts.',
                },
                {
                    name: '<output file>',
                    summary:
                        'Path where the LogicalScoredSuite file will be written. This file is made by adding a measures field to each step in the observed suite.',
                },
            ],
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'datapath',
                    alias: 'd',
                    description: `Path to prix-fixe data files used for menu-based repairs.\n
                - attributes.yaml
                - cookbook.yaml
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
                    name: 'x',
                    alias: 'x',
                    description:
                        `Use simple repair cost scoring that doesn't require menu files.\n` +
                        'The -d option and PRIX_FIXE_DATA_PATH are not required when using -x.',
                    type: Boolean,
                },
                {
                    name: 'verbose',
                    alias: 'v',
                    description: 'Print out failing test cases',
                    type: Boolean,
                },
                {
                    name: 'help',
                    alias: 'h',
                    description: 'Print help message',
                    type: Boolean,
                },
            ],
        },
    ];

    console.log(commandLineUsage(usage));
}

main();
