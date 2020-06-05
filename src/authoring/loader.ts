import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

import { validate } from './validate';

import {
  AnyRule,
  CatalogSpec,
  DimensionSpec,
  GroupSpec,
  partialCatalogSpecType,
  PartialCatalogSpec,
  TensorSpec,
} from './types';

export function loadCatalog(filename: string): CatalogSpec {
  const builder = new CatalogBuilder();
  builder.process(filename);
  return builder.build();
}

class CatalogBuilder {
  dimensions: DimensionSpec[] = [];
  tensors: TensorSpec[] = [];
  catalog: GroupSpec[] = [];
  rules: AnyRule[] = [];

  context: string[] = [process.cwd()];

  process(filename: string) {
    // console.log(`Reading ${filename}`);

    // Resolve filename relative to previous file.
    const resolved: string = path.resolve(
      this.context[this.context.length - 1],
      filename
    );

    // console.log(`Loading ${resolved}`);
    const root = yaml.safeLoad(fs.readFileSync(resolved, 'utf8'));
    const catalog = validate(partialCatalogSpecType, root);

    this.merge(catalog);

    if (catalog.imports !== undefined) {
      this.context.push(path.dirname(resolved));
      for (const f of catalog.imports) {
        this.process(f);
      }
      this.context.pop();
    }
  }

  merge(c: PartialCatalogSpec) {
    if (c.dimensions) {
      this.dimensions.push(...c.dimensions);
    }
    if (c.tensors) {
      this.tensors.push(...c.tensors);
    }
    if (c.catalog) {
      this.catalog.push(...c.catalog);
    }
    if (c.rules) {
      this.rules.push(...c.rules);
    }
  }

  build(): CatalogSpec {
    const c: CatalogSpec = {
      dimensions: this.dimensions,
      tensors: this.tensors,
      catalog: this.catalog,
      rules: this.rules,
    };

    return c;
  }
}
