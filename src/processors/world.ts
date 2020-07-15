import * as fs from 'fs';
import * as path from 'path';

import {
  AttributeInfo,
  attributesFromYamlString,
  CartOps,
  Catalog,
  catalogFromYamlString,
  cookbookFromYamlFile,
  DimensionAndTensorDescription,
  GroupBuilder,
  IRuleChecker,
  loadRuleConfig,
  MENUITEM,
  OPTION,
  processDimensions,
  processGroups,
  processRecipes,
  processRules,
  processTensors,
  RuleChecker,
  World,
} from '../core';

import { loadCatalogFile } from './file-loader';

export function createWorld(dataPath: string): World {
  // TODO: should these be path.resolve?
  const attributesFile = path.join(dataPath, 'attributes.yaml');
  const cookbookFile = path.join(dataPath, 'cookbook.yaml');
  const productsFile = path.join(dataPath, 'products.yaml');
  const optionsFile = path.join(dataPath, 'options.yaml');
  const rulesFile = path.join(dataPath, 'rules.yaml');

  const world = setup(
    attributesFile,
    cookbookFile,
    productsFile,
    optionsFile,
    rulesFile
  );

  return world;
}

export function setup(
  attributesFile: string,
  cookbookFile: string,
  productsFile: string,
  optionsFile: string,
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
  const catalog = Catalog.fromCatalog(products);
  catalog.merge(options);

  // Create the AttributeInfo instance.
  const attributes = attributesFromYamlString(
    fs.readFileSync(attributesFile, 'utf8')
  );
  const attributeInfo = new AttributeInfo(catalog, attributes);

  const cookbook = cookbookFromYamlFile(cookbookFile);

  const ruleConfig = loadRuleConfig(fs.readFileSync(rulesFile, 'utf8'));
  const ruleChecker: IRuleChecker = new RuleChecker(
    ruleConfig,
    catalog.getGenericMap()
  );

  const cart = new CartOps(attributeInfo, catalog, ruleChecker);

  return {
    attributeInfo,
    attributes,
    cartOps: cart,
    catalog,
    cookbook,
    ruleChecker,
  };
}

export function createWorld2(dataPath: string): World {
  // console.log('CreateWorld2');

  const catalogFile = path.join(dataPath, 'menu.yaml');
  const spec = loadCatalogFile(catalogFile);

  const dimensions = processDimensions(spec.dimensions);
  const tensors = processTensors(dimensions, spec.tensors);
  const attributes: DimensionAndTensorDescription = {
    dimensions: [...dimensions.values()].map(d => d.dimension),
    tensors: [...tensors.values()],
  };

  const builder = new GroupBuilder(dimensions, tensors, spec.skus);
  processGroups(builder, spec.catalog);
  const catalog = Catalog.fromEntities(
    builder.generics.values(),
    builder.specifics.values()
  );

  const attributeInfo = new AttributeInfo(catalog, attributes);

  const cookbook = processRecipes(catalog, spec.recipes);

  const ruleChecker = processRules(
    builder.tagsToPIDs,
    builder.pidsToUnits,
    spec.rules
  );

  const cartOps = new CartOps(attributeInfo, catalog, ruleChecker);

  return {
    attributes,
    attributeInfo,
    cartOps,
    catalog,
    cookbook,
    ruleChecker,
  };
}
