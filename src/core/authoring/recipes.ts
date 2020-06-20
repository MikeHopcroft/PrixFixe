import { ICatalog, MENUITEM, OPTION } from '../catalog';

import {
  Cookbook,
  OptionRecipe,
  OptionTemplate,
  ProductTemplate,
  ProductRecipe,
} from '../cookbook';

import { IdGenerator } from '../utilities';

import { ItemTemplateSpec, RecipeSpec } from './types';

export function processRecipes(
  catalog: ICatalog,
  specs: RecipeSpec[]
): Cookbook {
  const rids = new IdGenerator();

  const products: ProductRecipe[] = [];
  const options: OptionRecipe[] = [];

  for (const spec of specs) {
    if (spec.items.length > 0) {
      if (isProduct(spec.items[0].name)) {
        const recipe: ProductRecipe = {
          name: spec.name,
          rid: rids.next(),
          aliases: spec.aliases,
          products: spec.items.map(processProduct),
        };
        products.push(recipe);
      } else {
        const recipe: OptionRecipe = {
          name: spec.name,
          rid: rids.next(),
          aliases: spec.aliases,
          options: spec.items.map(processOption),
        };
        options.push(recipe);
      }
    }
  }

  return new Cookbook({ products, options });

  function isProduct(name: string): boolean {
    const item = catalog.getSpecificFromName(name);
    return item.kind === MENUITEM;
  }

  function processProduct(t: ItemTemplateSpec): ProductTemplate {
    const product = catalog.getSpecificFromName(t.name);
    if (product.kind !== MENUITEM) {
      const message = `Product recipe references option "${t.name}."`;
      throw new TypeError(message);
    }

    const options = t.children.map(processOption);

    return {
      quantity: t.quantity,
      key: product.key,
      options,
    };
  }

  function processOption(t: ItemTemplateSpec): OptionTemplate {
    const option = catalog.getSpecificFromName(t.name);
    if (option.kind !== OPTION) {
      const message = `Option recipe references product "${t.name}."`;
      throw new TypeError(message);
    }

    if (t.children !== []) {
      const message = `Option template "${t.name}" should not have children.`;
    }

    return {
      quantity: t.quantity,
      key: option.key,
    };
  }
}
