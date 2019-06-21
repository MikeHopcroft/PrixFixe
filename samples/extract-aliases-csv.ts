import * as path from 'path';
import * as fs from 'fs-extra';

import {
    aliasesFromPattern,
    patternFromExpression,
    setup,
    World,
    MENUITEM,
    OPTION,
} from '../src';

interface OptionProductAliases {
    productAliases: string[];
    optionAliases: string[];
}

function getOptionAndProductAliases(world: World): OptionProductAliases {
    const productAliases: string[] = [];
    const optionAliases: string[] = [];

    for (const item of world.catalog.genericEntities()) {
        const aliases: string[] = [];

        for (const alias of item.aliases) {
            const pattern = patternFromExpression(alias);
            for (const text of aliasesFromPattern(pattern)) {
                aliases.push(text);
            }
        }

        switch (item.kind) {
            case MENUITEM:
                productAliases.push(...aliases);
                break;
            case OPTION:
                optionAliases.push(...aliases);
                break;
            default:
                // Type system infers item as type `never`
                console.log(`Unknown item`);
                break;
        }
    }

    return {
        productAliases,
        optionAliases,
    };
}

async function saveCSVFile(aliases: string[], filename: string) {
    const csvText = aliases.join(',');

    await fs.ensureFile(filename).catch(err => new Error(err));
    await fs.writeFile(filename, csvText).catch(err => new Error(err));
}

async function go() {
    const world = setup(
        path.join(__dirname, '../../samples/data/restaurant-en/products.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/options.yaml'),
        path.join(
            __dirname,
            '../../samples/data/restaurant-en/attributes.yaml'
        ),
        path.join(__dirname, '../../samples/data/restaurant-en/rules.yaml')
    );

    const optionsAndProducts = getOptionAndProductAliases(world);

    await saveCSVFile(
        optionsAndProducts.optionAliases,
        path.join(__dirname, './out/options.csv')
    );
    await saveCSVFile(
        optionsAndProducts.productAliases,
        path.join(__dirname, './out/products.csv')
    );
}

go();
