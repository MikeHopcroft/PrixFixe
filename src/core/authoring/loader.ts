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

// tslint:disable-next-line:interface-name
export interface ILoader {
  push(name: string): Promise<string>;
  // push(name: string): void;
  pop(): void;
}

export class FileLoader implements ILoader {
  private readonly context: string[];

  constructor(root?: string) {
    this.context = [root || process.cwd()];
  }

  push(name: string): Promise<string> {
    // Resolve filename relative to previous file.
    const resolved: string = path.resolve(
      this.context[this.context.length - 1],
      name
    );

    // NOTE: context is not popped when readFile() fails.
    this.context.push(path.dirname(resolved));

    console.log(`readFile(${resolved})`);

    return new Promise<string>((resolve, reject) => {
      fs.readFile(resolved, 'utf8', (err, data) => {
        console.log(`readFile returned: ${err}`);
        err ? reject(err) : resolve(data);
      });
    });
  }

  pop(): void {
    this.context.pop();
  }
}

export async function loadCatalogSpec(
  loader: ILoader,
  name: string
): Promise<CatalogSpec> {
  const dimensions: DimensionSpec[] = [];
  const tensors: TensorSpec[] = [];
  const catalog: GroupSpec[] = [];
  const rules: AnyRule[] = [];
  const recipes: RecipeSpec[] = [];

  await process(name);
  return { dimensions, tensors, catalog, rules, recipes };

  async function process(fileName: string) {
    console.log(`Processing ${fileName}`);
    const text = await loader.push(fileName);
    // console.log(`text="${text}"`);
    const root = yaml.safeLoad(text);
    const catalog = validate(partialCatalogSpecType, root);

    merge(catalog);

    if (catalog.imports !== undefined) {
      for (const nestedFileName of catalog.imports) {
        await process(nestedFileName);
      }
    }

    // TODO: should this be in a catch block?
    loader.pop();
  }

  function merge(c: PartialCatalogSpec) {
    // console.log(`merge ${JSON.stringify(c, null, 2)}`);
    if (c.dimensions) {
      dimensions.push(...c.dimensions);
    }
    if (c.tensors) {
      tensors.push(...c.tensors);
    }
    if (c.catalog) {
      catalog.push(...c.catalog);
    }
    if (c.rules) {
      rules.push(...c.rules);
    }
    if (c.recipes) {
      recipes.push(...c.recipes);
    }
  }
}

export function loadCatalogFile(filename: string): CatalogSpec {
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
