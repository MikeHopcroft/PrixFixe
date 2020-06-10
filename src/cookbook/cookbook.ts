import { Key } from '../catalog';

import {
  ICookbook,
  ProductRecipe,
  OptionRecipe,
  RecipeList,
  RID,
} from './interfaces';

export class Cookbook implements ICookbook {
  ridToProductRecipe = new Map<RID, ProductRecipe>();
  ridToOptionRecipe = new Map<RID, OptionRecipe>();

  constructor(recipes: RecipeList) {
    for (const product of recipes.products) {
      if (this.ridToProductRecipe.has(product.rid)) {
        const message = `Encountered duplicate RID = ${product.rid}`;
        throw TypeError(message);
      } else {
        this.ridToProductRecipe.set(product.rid, product);
      }
    }
    for (const option of recipes.options) {
      if (this.ridToOptionRecipe.has(option.rid)) {
        const message = `Encountered duplicate RID = ${option.rid}`;
        throw TypeError(message);
      } else {
        this.ridToOptionRecipe.set(option.rid, option);
      }
    }
  }

  *productRecipes(): IterableIterator<ProductRecipe> {
    for (const recipe of this.ridToProductRecipe.values()) {
      yield recipe;
    }
  }

  *optionRecipes(): IterableIterator<OptionRecipe> {
    for (const recipe of this.ridToOptionRecipe.values()) {
      yield recipe;
    }
  }

  findProductRecipe(rid: RID, parent: Key): ProductRecipe {
    // TODO: for now, parent Key is ignored.
    // In the future will implement the ability to have different
    // recipes for different parents.
    const recipe = this.ridToProductRecipe.get(rid);
    if (recipe) {
      return recipe;
    } else {
      const message = `findProductRecipe: unknown RID = ${rid}`;
      throw TypeError(message);
    }
  }

  findOptionRecipe(rid: RID, parent: Key): OptionRecipe {
    // TODO: for now, parent Key is ignored.
    // In the future will implement the ability to have different
    // recipes for different parents.
    const recipe = this.ridToOptionRecipe.get(rid);
    if (recipe) {
      return recipe;
    } else {
      const message = `findOptionRecipe: unknown RID = ${rid}`;
      throw TypeError(message);
    }
  }
}
