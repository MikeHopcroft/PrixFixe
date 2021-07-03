const pathb = require('path-browserify');

import { validate } from '../utilities';

import {
  AnyRule,
  CatalogSpec,
  DimensionSpec,
  GroupSpec,
  partialCatalogSpecType,
  PartialCatalogSpec,
  TensorSpec,
  RecipeSpec,
  SkuSpec,
} from './types';

// tslint:disable-next-line:interface-name
export interface ILoader {
  load(name: string, push: boolean): Promise<object>;
  pop(): void;
}

export class ObjectLoader implements ILoader {
  private readonly context: string[];
  private readonly nameToObject: Map<string, object>;

  constructor(objects: Array<[string, object]>) {
    this.context = ['/'];
    this.nameToObject = new Map(objects);
  }

  load(name: string, push: boolean): Promise<object> {
    // Resolve filename relative to previous file.
    const resolved: string = pathb.posix.resolve(
      this.context[this.context.length - 1],
      name
    );

    if (push) {
      // NOTE: context is not popped when readFile() fails.
      this.context.push(pathb.posix.dirname(resolved));
    }

    console.log(`readFile(${resolved})`);
    const obj = this.nameToObject.get(resolved);
    if (!obj) {
      const message = `ObjectLoader: cannot find ${resolved}`;
      throw new TypeError(message);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise<object>((resolve, reject) => {
      resolve(obj);
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
  const skus: SkuSpec[] = [];

  await process(name);
  return { dimensions, tensors, catalog, rules, recipes, skus };

  async function process(fileName: string) {
    console.log(`Processing ${fileName}`);
    const root = await loader.load(fileName, true);
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
