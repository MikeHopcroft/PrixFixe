import * as fs from 'fs';

import {
    Attributes,
    AttributeInfo,
    attributesFromYamlString,
    CartOps,
    Catalog,
    catalogFromYamlString,
    ICartOps,
    ICatalog,
    loadRuleConfig,
    MENUITEM,
    MODIFIER,
    OPTION,
    RuleChecker,
} from '..';

export interface World {
    attributeInfo: AttributeInfo;
    attributes: Attributes;
    cartOps: ICartOps;
    catalog: ICatalog;
    ruleChecker: RuleChecker;
}

export function setup(
    productsFile: string,
    optionsFile: string,
    modifiersFile: string,
    attributesFile: string,
    rulesFile: string
): World {
    // Load items from menu data.
    const products = catalogFromYamlString(
        fs.readFileSync(productsFile, 'utf8'),
        MENUITEM
    );
    const options = catalogFromYamlString(
        fs.readFileSync(optionsFile, 'utf8'),
        OPTION
    );
    const modifiers = catalogFromYamlString(
        fs.readFileSync(modifiersFile, 'utf8'),
        MODIFIER
    );
    const catalog = Catalog.fromCatalog(products);
    catalog.merge(options);
    catalog.merge(modifiers);

    // Create the AttributeInfo instance.
    const attributes = attributesFromYamlString(
        fs.readFileSync(attributesFile, 'utf8')
    );
    const attributeInfo = new AttributeInfo(catalog, attributes);

    const ruleConfig = loadRuleConfig(fs.readFileSync(rulesFile, 'utf8'));
    const ruleChecker = new RuleChecker(ruleConfig, catalog.mapGeneric);

    const cartOps = new CartOps(attributeInfo, catalog, ruleChecker);

    return {
        attributeInfo,
        attributes,
        cartOps,
        catalog,
        ruleChecker,
    };
}
