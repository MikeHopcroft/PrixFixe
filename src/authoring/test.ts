import * as yaml from 'js-yaml';
import * as fs from 'fs';

import { processDimensions, processTensors } from './attributes';
import { loadCatalog } from './loader';
import { processGroups, GroupBuilder } from './products';
import { processRules } from './rules';

import {
  AnyRule,
  catalogSpecType,
  DimensionSpec,
  GroupSpec,
  TensorSpec,
} from './types';

import { validate } from './validate';

export function build(
  ds: DimensionSpec[],
  ts: TensorSpec[],
  gs: GroupSpec[],
  rs: AnyRule[]
): void {
  const dimensions = processDimensions(ds);
  const tensors = processTensors(dimensions, ts);

  const builder = new GroupBuilder(dimensions, tensors);
  processGroups(builder, gs);

  const rules = processRules(builder.tagsToPIDs, rs);

  console.log(' ');
  console.log('=== Generics ===');
  console.log(JSON.stringify(builder.generics, null, 4));

  console.log(' ');
  console.log('=== Specifics ===');
  console.log(JSON.stringify(builder.specifics, null, 4));

  console.log(' ');
  console.log('=== tagsToPIDs ===');
  for (const [k, v] of builder.tagsToPIDs.entries()) {
    console.log(`${k}: ${v}`);
  }

  // return {
  //     dimensions: [...dimensions.values()].map(d => d.dimension),
  //     tensors: [...tensors.values()],
  // };
}

function go(filename: string) {
  // const root = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
  // const spec = validate(catalogSpecType, root);

  const spec = loadCatalog(filename);

  build(spec.dimensions, spec.tensors, spec.catalog, spec.rules);

  // console.log(JSON.stringify(x, null, 4));
}

// go('c:\\temp\\catalog.yaml');
// go('d:\\git\\menubot\\prixfixe\\samples\\menu\\coffee.yaml');
go('d:\\git\\menubot\\shortorder\\samples\\menu\\coffee.yaml');
console.log('done done done done');
