import { ItemInstance } from '../cart';
import { Key } from '../catalog';

export type RID = number;

export interface RecipeList {
    products: ProductRecipe[];
    options: OptionRecipe[];
}

export interface ProductRecipe {
    name: string;
    rid: RID;
    aliases: string[];
    products: ProductTemplate[];
}

export interface OptionRecipe {
    name: string;
    rid: RID;
    aliases: string[];
    options: OptionTemplate[];
}

export interface ProductTemplate {
    quantity: number;
    key: Key;
    options: OptionTemplate[];
}

export interface OptionTemplate {
    quantity: number;
    key: Key;
}

// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
export interface ICookbook {
    productRecipes(): IterableIterator<ProductRecipe>;
    optionRecipes(): IterableIterator<OptionRecipe>;
    findProductRecipe(rid: RID, parent: Key): ProductRecipe;
    findOptionRecipe(rid: RID, parent: Key): OptionRecipe;
}
