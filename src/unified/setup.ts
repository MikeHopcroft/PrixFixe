import * as fs from 'fs';

import {
    Attributes,
    AttributeInfo,
    attributesFromYamlString,
    AttributeUtils,
    CartUtils,
    Catalog,
    catalogFromYamlString,
    loadRuleConfig,
    MENUITEM,
    OPTION,
    RuleChecker
} from '..';

import { IDGenerator } from './id_generator';

export interface World {
    attributeOps: AttributeUtils;
    attributes: Attributes;
    attributeInfo: AttributeInfo;
    cartOps: CartUtils;
    catalog: Catalog;
    ruleChecker: RuleChecker;
}

export function setup(
    productsFile: string,
    optionsFile: string,
    attributesFile: string,
    rulesFile: string,
    debugMode: boolean
): World {
    // Load items from menu data.
    const products = catalogFromYamlString(fs.readFileSync(productsFile, 'utf8'), MENUITEM);
    const options = catalogFromYamlString(fs.readFileSync(optionsFile, 'utf8'), OPTION);
    const catalog = Catalog.fromCatalog(products);
    catalog.merge(options);
 
    // Create the AttributeInfo instance.
    const attributes = attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
    const attributeInfo = AttributeInfo.factory(catalog, attributes);

    const ruleConfig = loadRuleConfig(fs.readFileSync(rulesFile, 'utf8'));
    const ruleChecker = new RuleChecker(ruleConfig, catalog.mapGeneric);

    const uidGenerator = new IDGenerator();

    const attributeOps = new AttributeUtils(catalog, uidGenerator, attributeInfo);
    const cartOps = new CartUtils(catalog);

    return {
        attributeOps,
        attributes,
        attributeInfo,
        cartOps,
        catalog,
        ruleChecker,
    };
}