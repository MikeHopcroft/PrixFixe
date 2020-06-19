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
  RecipeSpec,
} from './types';

export function loadCatalog(filename: string): CatalogSpec {
  const builder = new CatalogBuilder();
  builder.process(filename);
  return builder.build();
}

class CatalogBuilder {
  private readonly dimensions: DimensionSpec[] = [];
  private readonly tensors: TensorSpec[] = [];
  private readonly catalog: GroupSpec[] = [];
  private readonly rules: AnyRule[] = [];
  private readonly recipes: RecipeSpec[] = [];

  private readonly context: string[] = [process.cwd()];

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

  private merge(c: PartialCatalogSpec) {
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
    if (c.recipes) {
      this.recipes.push(...c.recipes);
    }
  }

  build(): CatalogSpec {
    const c: CatalogSpec = {
      dimensions: this.dimensions,
      tensors: this.tensors,
      catalog: this.catalog,
      rules: this.rules,
      recipes: this.recipes,
    };

    return c;
  }
}
