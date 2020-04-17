import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';

import { createWorld, World } from '../processors';

import {
    aggregateMeasures,
    loadLogicalValidationSuite,
    SuiteScorer,
    writeYAML
} from "../test_suite2";

function convertLegacyTestSuiteFile()
{
    dotenv.config();

    const args = minimist(process.argv.slice(2));

    if (args.h || args.help) {
        showUsage();
        return succeed(false);
    }

    if (args._.length !== 3) {
        return fail('Error: expected command line three parameters.');
    }

    const expectedFile = args._[0];
    const observedFile = args._[1];
    const scoredFile = args._[2];

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }
    if (dataPath === undefined) {
        const message =
            'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
        return fail(message);
    }

    console.log('Comparing');
    console.log(`  expected validation suite: ${expectedFile}`);
    console.log(`  observed validation suite: ${observedFile}`);
    console.log(' ');
    console.log(`With data path = ${dataPath}`);
    console.log(' ');

    let world: World;
    try {
        world = createWorld(dataPath);
    } catch (err) {
        if (err.code === 'ENOENT' || err.code === 'EISDIR') {
            const message = `Error: create world failed: cannot open "${err.path}"`;
            return fail(message);
        } else {
            throw err;
        }
    }

    // Load the expected validation suite.
    const expectedSuite = loadLogicalValidationSuite(expectedFile);
    const observedSuite = loadLogicalValidationSuite(observedFile);

    const scorer = new SuiteScorer(world.attributeInfo, world.catalog);
    const scoredSuite = scorer.scoreSuite(observedSuite, expectedSuite);

    console.log(`Writing scored suite to ${scoredFile}`);
    writeYAML(scoredFile, scoredSuite);

    console.log('Scoring complete');
    console.log('');

    // Print out summary.
    const measures = aggregateMeasures(scoredSuite);
    console.log(`total steps: ${measures.totalSteps}`);
    formatFraction('perfect carts', measures.perfectSteps, measures.totalSteps);
    formatFraction('complete carts', measures.completeSteps, measures.totalSteps);
    console.log(`total repairs: ${measures.totalRepairs}`);
    console.log(`repairs/step: ${(measures.totalRepairs/measures.totalSteps).toFixed(2)}`);

    return succeed(true);
}

function formatFraction(name: string, n: number, d: number) {
    const percent = (n/d*100).toFixed(1);
    console.log(`${name}: ${n}/${d} (${percent}%)`);
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
                `node ${program} <expected file> <observed file > <output file> [...options]`,
            ],
        },
        {
            header: 'Required Parameters',
            content: [
                {
                    name: '<expected file>',
                    summary: 'Path to a LogicalValidationSuite file with the expected carts.',
                },
                {
                    name: '<observed file>',
                    summary: 'Path to a LogicalValidationSuite file with the observed carts.',
                },
                {
                    name: '<output file>',
                    summary: 'Path where the LogicalScoredSuite file will be written. This file is made by adding a measures field to each step in the observed suite.',
                },
            ],
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'd',
                    alias: 'd',
                    description: `Path to prix-fixe data files.\n
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

function fail(message: string) {
    console.log(' ');
    console.log(message);
    console.log(' ');
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

function go() {
    convertLegacyTestSuiteFile();
}

go();
