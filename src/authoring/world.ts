import * as path from 'path';

import { AttributeInfo, DimensionAndTensorDescription } from '../attributes';
import { CartOps } from '../cart';
import { Catalog } from '../catalog';
import { Cookbook } from '../cookbook';
import { World } from '../processors';

import { processDimensions, processTensors } from './attributes';
import { loadCatalog } from './loader';
import { processGroups, GroupBuilder } from './products';
import { processRules } from './rules';
import { processRecipes } from './recipes';

export function createWorld2(dataPath: string): World {
  // console.log('CreateWorld2');

  const catalogFile = path.join(dataPath, 'menu.yaml');
  const spec = loadCatalog(catalogFile);

  const dimensions = processDimensions(spec.dimensions);
  const tensors = processTensors(dimensions, spec.tensors);
  const attributes: DimensionAndTensorDescription = {
    dimensions: [...dimensions.values()].map(d => d.dimension),
    tensors: [...tensors.values()],
  };

  const builder = new GroupBuilder(dimensions, tensors);
  processGroups(builder, spec.catalog);
  const catalog = Catalog.fromEntities(
    builder.generics.values(),
    builder.specifics.values()
  );

  const attributeInfo = new AttributeInfo(catalog, attributes);

  const cookbook = processRecipes(catalog, spec.recipes);

  const ruleChecker = processRules(builder.tagsToPIDs, spec.rules);

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
