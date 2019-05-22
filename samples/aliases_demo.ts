import * as path from 'path';

import { AID, aliasesFromPattern, patternFromExpression, setup, World, MENUITEM, MODIFIER, OPTION } from '../src';

///////////////////////////////////////////////////////////////////////////////
//
// Example of enumerating aliases for attributes, products, and options
//
///////////////////////////////////////////////////////////////////////////////

function printAttributes(world: World) {
    console.log();
    console.log('=== Dimensions and Attributes ===');
    for (const d of world.attributes.dimensions) {
        console.log(`Dimension(${d.did}): ${d.name}`);
        for (const attribute of d.items) {
            console.log(`  Attribute(${attribute.pid})`);
            for (const alias of attribute.aliases) {
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    console.log(`    ${text}`);
                }
            }
        }
    }
}

function printProducts(world: World) {
    console.log();
    console.log('=== Products and Options ===');
    for (const item of world.catalog.genericEntities()) {
        switch (item.kind) {
            case MENUITEM:
                console.log(`Product(${item.pid}): ${item.name}`);
                break;
            case MODIFIER:
                console.log(`Modifier(${item.pid}): ${item.name}`);
                break;
            case OPTION:
                console.log(`Option(${item.pid}): ${item.name}`);
                break;
            default:
                // Type system infers item as type `never`
                console.log(`Unknown item`);
                break;
        }
        for (const alias of item.aliases) {
            const pattern = patternFromExpression(alias);
            for (const text of aliasesFromPattern(pattern)) {
                console.log(`  ${text}`);
            }
        }
    }
}


function go() {
    const world = setup(
        path.join(__dirname, '../../samples/data/restaurant-en/menu.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/options.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/modifiers.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/attributes.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/rules.yaml'),
        false
    );

    printAttributes(world);
    printProducts(world);
}

go();
