import { AttributeInfo, DimensionAndTensorDescription } from '../attributes';
import { CartOps } from '../cart';
import { Catalog } from '../catalog';
import { World } from '../world';

import { processDimensions, processTensors } from './attributes';
import { processGroups, GroupBuilder } from './products';
import { processRules } from './rules';
import { processRecipes } from './recipes';
import { CatalogSpec } from './types';

export function createWorld3(spec: CatalogSpec): World {
  // console.log('CreateWorld3');

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
