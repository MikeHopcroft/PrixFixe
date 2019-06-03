import * as path from 'path';

import {
    DID,
    aliasesFromPattern,
    patternFromExpression,
    setup,
    World,
    MENUITEM,
    OPTION,
} from '../src';

///////////////////////////////////////////////////////////////////////////////
//
// Example of enumerating aliases for attributes, products, and options
//
///////////////////////////////////////////////////////////////////////////////

// Walks over the catalog collecting those dimensions that are referenced by
// Producs and those referenced by Options and Modifiers.
function categorizeAttributes(world: World) {
    const productDimensions = new Set<DID>();
    const optionDimensions = new Set<DID>();

    for (const product of world.catalog.genericEntities()) {
        const matrix = world.attributeInfo.getMatrix(product.tensor);
        for (const dimension of matrix.dimensions) {
            if (product.kind === MENUITEM) {
                productDimensions.add(dimension.did);
            } else {
                optionDimensions.add(dimension.did);
            }
        }
    }

    return { productDimensions, optionDimensions };
}

// Prints out information about dimensions associated with a set of DIDs.
function printDimensions(world: World, dimensions: Set<DID>) {
    for (const did of dimensions.values()) {
        const d = world.attributeInfo.getDimension(did);
        console.log(`  Dimension(${d.did}): ${d.name}`);
        for (const attribute of d.attributes) {
            console.log(`    Attribute(${attribute.aid})`);
            for (const alias of attribute.aliases) {
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    console.log(`      ${text}`);
                }
            }
        }
    }
}

// Prints Dimensions and Attributes, first for Products, and then for
// non-products (Options and Modifiers).
function printAttributes(world: World) {
    const { productDimensions, optionDimensions } = categorizeAttributes(world);

    console.log();
    console.log('=== Product Dimensions and Attributes ===');
    printDimensions(world, productDimensions);

    console.log();
    console.log('=== Option and Modifier Dimensions and Attributes ===');
    printDimensions(world, optionDimensions);
}

function printProducts(world: World) {
    console.log();
    console.log('=== Products and Options ===');
    for (const item of world.catalog.genericEntities()) {
        switch (item.kind) {
            case MENUITEM:
                console.log(`Product(${item.pid}): ${item.name}`);
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
        path.join(__dirname, '../../samples/data/restaurant-en/products.yaml'),
        path.join(__dirname, '../../samples/data/restaurant-en/options.yaml'),
        path.join(
            __dirname,
            '../../samples/data/restaurant-en/attributes.yaml'
        ),
        path.join(__dirname, '../../samples/data/restaurant-en/rules.yaml')
    );

    printAttributes(world);
    printProducts(world);
}

go();
