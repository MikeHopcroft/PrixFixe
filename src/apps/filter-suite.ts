import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';

import { suitePredicate } from '../test_suite/suite_predicate';

import {
    allCases,
    CombinedTurn,
    convertSuite,
    fail,
    handleError,
    keepCart,
    keepAudio,
    loadLogicalValidationSuite,
    removeAudio,
    removeCart,
    removeTranscription,
    succeed,
    suitePredicateFilter,
    writeYAML,
} from '../test_suite2';

function main() {
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

    try {
        // Load the input test suite.
        console.log(`Reading suite to ${inFile}`);
        const inputSuite = loadLogicalValidationSuite<CombinedTurn>(inFile);

        const suiteExpressionText = args['s'];
        let suiteExpression = allCases;
        if (suiteExpressionText) {
            console.log(
                `Keeping tests matching suite expression: ${suiteExpressionText}`
            );
            suiteExpression = suitePredicateFilter(
                suitePredicate(suiteExpressionText)
            );
        }

        let stepConverter = keepCart;
        if (args.c) {
            console.log('Removing cart field from each Step.');
            stepConverter = removeCart;
        }

        let outputSuite;
        if (args.t) {
            console.log('Removing transcript field from each Turn');
            outputSuite = convertSuite(
                inputSuite,
                suiteExpression,
                stepConverter,
                removeTranscription
            );
        } else if (args.a) {
            console.log('Removing audio field from each Turn');
            outputSuite = convertSuite(
                inputSuite,
                suiteExpression,
                stepConverter,
                removeAudio
            );
        } else {
            outputSuite = convertSuite(
                inputSuite,
                suiteExpression,
                stepConverter,
                keepAudio
            );
        }

        console.log(`Writing filtered suite to ${outFile}`);
        writeYAML(outFile, outputSuite);
    } catch (e) {
        handleError(e);
    }

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
                    description:
                        'Remove the transcription field from each turn.',
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

main();
