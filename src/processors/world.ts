import path from 'path';

import {
  AttributeInfo,
  CartOps,
  Catalog,
  DimensionAndTensorDescription,
  GroupBuilder,
  processDimensions,
  processGroups,
  processRecipes,
  processRules,
  processTensors,
  World,
} from '../core';

import { loadCatalogFile } from './file-loader';

export function createWorld(dataPath: string): World {
  const catalogFile = path.join(dataPath, 'menu.yaml');
  const spec = loadCatalogFile(catalogFile);

  const dimensions = processDimensions(spec.dimensions);
  const tensors = processTensors(dimensions, spec.tensors);
  const attributes: DimensionAndTensorDescription = {
    dimensions: [...dimensions.values()].map((d) => d.dimension),
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
