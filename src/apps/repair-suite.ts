import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';

import { createWorld2 } from '../authoring';

import {
    CombinedTurn,
    fail,
    handleError,
    loadLogicalValidationSuite,
    succeed,
    LogicalCart,
    LogicalItem,
    enumerateTestCases,
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

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }
    if (dataPath === undefined) {
        const message =
            'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
        return fail(message);
    }

    try {
        // Create a map from ItemInstance name to SKU.
        const world = createWorld2(dataPath);
        const nameToSKU = new Map<string, number>();
        for (const s of world.catalog.specificEntities()) {
            if (nameToSKU.has(s.name)) {
                console.log(`old SKU = ${nameToSKU.get(s.name)!}`);
                console.log(`new SKU = ${s.sku}`);
                throw new TypeError(`repairSuite: Duplicate name ${s.name}`);
            }
            nameToSKU.set(s.name, s.sku);
            console.log(`${s.name}: ${s.sku}`);
        }

        // Load the input test suite.
        console.log(`Reading suite from ${inFile}`);
        const inputSuite = loadLogicalValidationSuite<CombinedTurn>(inFile);

        // Gather all of the converted SKUs, in the order they appear in the
        // inputSuite.
        const skus: number[] = [];
        for (const test of enumerateTestCases(inputSuite)) {
            for (const step of test.steps) {
                collectSKUsFromCart(nameToSKU, skus, step.cart);
            }
        }
        // console.log(JSON.stringify(skus, null, 4));

        // Now read in the input text and replace the SKUs.
        // DESIGN NOTE: this approach preserves comments and whitespace in the
        // YAML file.
        const inputText = fs.readFileSync(inFile, 'utf8');
        const outputText = replaceSKUsInText(inputText, skus);

        // Alternative approach, which doesn't preserve comments:
        // const outputSuite = mapSuite(inputSuite, test => {
        //     const steps = test.steps.map(step => {
        //         const cart = repairCart(nameToSKU, step.cart);
        //         return { ...step, cart };
        //     });
        //     return { ...test, steps };
        // });
        // writeYAML(outFile, outputSuite);

        console.log(`Writing repaired suite to ${outFile}`);
        fs.writeFileSync(outFile, outputText);
    } catch (e) {
        handleError(e);
    }

    console.log('Repairs complete');
    return succeed(true);
}

// Function used by alternative approach
// function repairCart(nameToSKU: Map<string, number>, cart: LogicalCart) {
//     const items = cart.items.map( item => {
//         const sku = nameToSKU.get(item.name)!.toString();
//         return { ...item, sku };
//     });

//     return { ...cart, items };
// }

// Enumerates corrected SKUs in the order they appear in cart.
function collectSKUsFromCart(
    nameToSKU: Map<string, number>,
    skus: number[],
    cart: LogicalCart
) {
    collectSKUsFromItems(nameToSKU, skus, cart.items);
    return cart;
}

// Enumerates corrected SKUs in the order they appear in the item list.
function collectSKUsFromItems(
    nameToSKU: Map<string, number>,
    skus: number[],
    items: LogicalItem[]
) {
    for (const item of items) {
        // Use item.name to find correct SKU.
        if (!nameToSKU.has(item.name)) {
            console.log(`cannot find "${item.name}"`);
        }
        skus.push(nameToSKU.get(item.name)!);

        // Recurse into children.
        collectSKUsFromItems(nameToSKU, skus, item.children);
    }
}

function replaceSKUsInText(text: string, skus: number[]) {
    const lines = text.split(/\r?\n/);
    const edited = replaceSKUsInLines(lines, skus);
    return edited.join('\n');
}

function replaceSKUsInLines(lines: string[], skus: number[]) {
    let i = 0;
    return lines.map(line => {
        if (line.match(/^(\s*sku: ['"])\d+(['"]\s*)$/)) {
            line = line.replace(/^(\s*sku: ['"])\d+(['"]\s*)$/, `$1${skus[i++]}$2`);
        }
        return line;
    });
}

function showUsage() {
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
        {
            header: 'Repair suite',
            content: `This utility uses LogicalItem names to fix bad SKUs in a test suite.`,
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
