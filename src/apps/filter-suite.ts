import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as minimist from 'minimist';
import * as path from 'path';

import { allSuites, suiteFilter } from '../test_suite/suite_filter';

import {
    CombinedTurn,
    convertSuite,
    keepCart,
    keepAudio,
    logicalValidationSuite,
    removeAudio,
    removeCart,
    removeTranscription,
    writeYAML,
} from "../test_suite2";

function filterTestSuiteFile()
{
    dotenv.config();

    const args = minimist(process.argv.slice(2));

    if (args.h || args.help) {
        showUsage();
        return succeed(false);
    }

    if (args._.length !== 2) {
        return fail('Error: expected command line two parameters.');
    }

    const inFile = args._[0];
    const outFile = args._[1];

    // Load the input test suite.
    console.log(`Reading suite from ${inFile}`);
    let yamlTextIn: string;
    try {
        yamlTextIn = fs.readFileSync(inFile, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT' || err.code === 'EISDIR') {
            const message = `Error: cannot open ${inFile}`;
            return fail(message);
        } else {
            throw err;
        }
    }

    let inputSuite;
    try {
        const root = { tests: yaml.safeLoad(yamlTextIn) };
        inputSuite = logicalValidationSuite<CombinedTurn>(root);
    } catch (err) {
        const message = `Error: invalid yaml in ${inFile}`;
        return fail(message);
    }


    const suiteExpressionText = args['s'];
    let suiteExpression = allSuites;
    if (suiteExpressionText) {
        console.log(
            `Keeping tests matching suite expression: ${suiteExpressionText}`
        );
        suiteExpression = suiteFilter(suiteExpressionText);
    }

    const cartFilter = args.c ? removeCart : keepCart;
    if (args.c) {
        console.log('Removing cart field from each Step.');
    }

    let outputSuite;
    if (args.t) {
        console.log('Removing transcript field from each Turn');
        outputSuite = convertSuite(inputSuite, suiteExpression, cartFilter, removeTranscription);
    } else if (args.a) {
        console.log('Removing audio field from each Turn');
        outputSuite = convertSuite(inputSuite, suiteExpression, cartFilter, removeAudio);
    } else {
        outputSuite = convertSuite(inputSuite, suiteExpression, cartFilter, keepAudio);
    }

    console.log(`Writing filtered suite to ${outFile}`);
    writeYAML(outFile, outputSuite);

    console.log('Filtering complete');
    return succeed(true);
}

function showUsage() {
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
        {
            header: 'Test suite filter',
            content: `This utility filters carts, transcriptions, audio, and entire test cases from a supplied test suite.`,
        },
        {
            header: 'Usage',
            content: [
                `node ${program} <input file> <output file> [...options]`,
            ],
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'a',
                    alias: 'a',
                    description: 'Remove the audio field from each turn.',
                    type: Boolean,
                },
                {
                    name: 'c',
                    alias: 'c',
                    description: 'Remove the cart field from each step.',
                    type: Boolean,
                },
                {
                    name: 't',
                    alias: 't',
                    description: 'Remove the transcription field from each turn.',
                    type: Boolean,
                },
                {
                    name: 's',
                    alias: 's',
                    typeLabel: '{underline suiteFilter}',
                    description:
                        'Boolean expression of suites to retain.' +
                        'Can use suite names, !, &, |, and parentheses.',
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
    filterTestSuiteFile();
}

go();
