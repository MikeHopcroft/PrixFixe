import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';

import { ICatalog } from '../catalog';
import { createWorld } from '../processors';

import {
    CombinedTurn,
    fail,
    GenericCase,
    handleError,
    loadLogicalValidationSuite,
    succeed,
    ValidationStep,
    writeYAML,
} from '../test_suite2';
import { markdown } from '../test_suite2/markdown';
import { fstat } from 'fs';

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

    // let dataPath = process.env.PRIX_FIXE_DATA;
    // if (args.d) {
    //     dataPath = args.d;
    // }
    // if (dataPath === undefined) {
    //     const message =
    //         'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
    //     return fail(message);
    // }

    try {
        // // Load the world, which provides the AttributeInfo and ICatalog.
        // // TODO: consider loading only products.yaml and options.yaml here.
        // const world = createWorld(dataPath);
        // function predicate(
        //     test: GenericCase<ValidationStep<CombinedTurn>>
        // ): boolean {
        //     return hasBadSKUs(test, world.catalog);
        // }

        // Load the input test suite.
        console.log(`Reading suite from ${inFile}`);
        const inputSuite = loadLogicalValidationSuite<CombinedTurn>(inFile);

        // const outputSuite = {
        //     tests: inputSuite.tests.filter(predicate),
        // };

        // const removed = inputSuite.tests.length - outputSuite.tests.length;
        // if (removed) {
        //     console.log(`Removed ${removed} tests`);
        // } else {
        //     console.log(`All test SKUs in menu.`);
        // }

        console.log(`Writing markdown to ${outFile}`);
        // writeYAML(outFile, outputSuite);
        const lines = markdown(inputSuite);
        fs.writeFileSync(outFile, lines);
        // console.log(lines);
    } catch (e) {
        handleError(e);
    }

    // console.log('Filtering complete');
    return succeed(true);
}

function showUsage() {
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
        {
            header: 'Format test suite as markdown',
            content: `This utility formats a test suite as markdown.`,
        },
        {
            header: 'Usage',
            content: [`node ${program} <input file> <output file>`],
        },
    ];

    console.log(commandLineUsage(usage));
}

// function hasBadSKUs(
//     test: GenericCase<ValidationStep<CombinedTurn>>,
//     catalog: ICatalog
// ): boolean {
//     const bad = badSKUs(test, catalog);
//     if (bad.size > 0) {
//         console.log(`Test ${test.id} has ${bad.size} bad SKUs:`);
//         for (const sku of bad.values()) {
//             console.log(`  ${sku}`);
//         }
//     }

//     return bad.size === 0;
// }

// function badSKUs(
//     test: GenericCase<ValidationStep<CombinedTurn>>,
//     catalog: ICatalog
// ): Set<string> {
//     const bad = new Set<string>();
//     for (const step of test.steps) {
//         for (const item of step.cart.items) {
//             if (!catalog.hasSKU(Number(item.sku))) {
//                 bad.add(item.sku);
//                 for (const child of item.children) {
//                     if (!catalog.hasSKU(Number(child.sku))) {
//                         bad.add(child.sku);
//                     }
//                 }
//             }
//         }
//     }
//     return bad;
// }

main();