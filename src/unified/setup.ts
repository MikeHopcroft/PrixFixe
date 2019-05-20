import * as fs from 'fs';
import * as yaml from 'js-yaml';

import {
    Attributes,
    AttributeInfo,
    attributesFromYamlString,
    CartUtils,
    Catalog,
    // ConvertDollarsToPennies,
    GenericTypedEntity,
    SpecificTypedEntity,
    // validateCatalogItems
} from '..';

export interface World {
    attributes: Attributes;
    attributeInfo: AttributeInfo;
    catalog: Catalog;
    ops: CartUtils;
}

export function setup(
    menuFile: string,
    attributesFile: string,
    debugMode: boolean
): World {
    // Load items from menu data. Will generics and specifics eventually live
    // in separate files?
    const menu = yaml.safeLoad(fs.readFileSync(menuFile, 'utf8'));
    const genericItems: IterableIterator<GenericTypedEntity> =
        menu.genericItems;
    const specificItems: IterableIterator<SpecificTypedEntity> =
        menu.specificItems;

    // TODO: Validate the catalog. Do any housekeeping. These functions should
    // throw an error if they fail.
    // validateCatalogItems(genericItems, specificItems);
    // ConvertDollarsToPennies(catalogItems);

    // Create the Catalog instance.
    const catalog = new Catalog(genericItems, specificItems);

    // Create the AttributeInfo instance.
    const attributes = attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
    const attributeInfo = AttributeInfo.factory(catalog, attributes);

    // const intents = yaml.safeLoad(fs.readFileSync(intentsFile, 'utf8'));

    const ops = new CartUtils(catalog);

    return {
        attributes,
        attributeInfo,
        catalog,
        ops,
    };
}