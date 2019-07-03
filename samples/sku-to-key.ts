import * as path from 'path';

import {
    Key,
    setup,
    SKU,
    MENUITEM,
    OPTION,
    World,
} from '../src';

export interface KeyName {
    name: string;
    sku: SKU;
    key: Key;
}

const getKeyNameLookup = (world: World) => {
    const keyLookup = new Map<SKU, KeyName>();

    for (const specific of world.catalog.specificEntities()) {
        const key = specific.key;
        const sku = specific.sku;
        const name = specific.name;

        keyLookup.set(sku, {
            key,
            name,
            sku,
        });
    }

    return keyLookup;
};


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

    const keyLookup = getKeyNameLookup(world);

    console.log('Performing lookup on some skus:');

    console.log(keyLookup.get(8005));
    console.log(keyLookup.get(9018));
    console.log(keyLookup.get(9003));
}

go();

