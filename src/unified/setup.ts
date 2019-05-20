import * as fs from 'fs';
import * as yaml from 'js-yaml';

import {
    Attributes,
    AttributeInfo,
    attributesFromYamlString,
    AttributeUtils,
    CartUtils,
    Catalog,
    // ConvertDollarsToPennies,
    GenericTypedEntity,
    SpecificTypedEntity,
    // validateCatalogItems,
    UID,
} from '..';

export interface World {
    atrOps: AttributeUtils;
    attributes: Attributes;
    attributeInfo: AttributeInfo;
    cartOps: CartUtils;
    catalog: Catalog;
    uidCount: UID;
}

export function setup(
    menuFile: string,
    attributesFile: string,
    debugMode: boolean
): World {
    // Load items from menu data.
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

    let uidCount: UID = 0;
    uidCount += 1;              // TODO: remove this tslint fix

    const atrOps = new AttributeUtils(catalog, uidCount, attributeInfo);
    const cartOps = new CartUtils(catalog, uidCount);

    return {
        atrOps,
        attributes,
        attributeInfo,
        cartOps,
        catalog,
        uidCount,
    };
}