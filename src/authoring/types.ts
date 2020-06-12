import * as t from 'io-ts';

export type AID = number;
export type DID = number;
export type Key = string;
export type TID = number;

export const WILDCARD = '*';

///////////////////////////////////////////////////////////////////////////////
//
// Attributes, Dimensions, and Tensors
//
///////////////////////////////////////////////////////////////////////////////
const attributeSpecType = t.intersection([
  t.type({
    name: t.string,
    aliases: t.array(t.string),
  }),
  t.partial({
    hidden: t.boolean,
  }),
]);

export type AttributeSpec = t.TypeOf<typeof attributeSpecType>;

const dimensionSpecType = t.type({
  name: t.string,
  attributes: t.array(attributeSpecType),
});
export type DimensionSpec = t.TypeOf<typeof dimensionSpecType>;

const tensorSpecType = t.type({
  name: t.string,
  dimensions: t.array(t.string),
});
export type TensorSpec = t.TypeOf<typeof tensorSpecType>;

///////////////////////////////////////////////////////////////////////////////
//
// Groups
//
///////////////////////////////////////////////////////////////////////////////

// createEnum() from https://github.com/gcanti/io-ts/issues/67
// tslint:disable-next-line:no-any
const createEnum = <E>(e: any, name: string): t.Type<E> => {
  // tslint:disable-next-line:no-any
  const keys: any = {};
  Object.keys(e).forEach(k => {
    keys[e[k]] = null;
  });
  // tslint:disable-next-line:no-any
  return t.keyof(keys, name) as any;
};

export enum ItemType {
  PRODUCT = 'product',
  OPTION = 'option',
}

// tslint:disable-next-line:variable-name
const ItemTypeType = createEnum<ItemType>(ItemType, 'ItemType');

const includeFormType = t.type({
  include: t.array(t.string),
});
const excludeFormType = t.type({
  exclude: t.array(t.string),
});
const formSpecType = t.union([includeFormType, excludeFormType]);
export type FormSpec = t.TypeOf<typeof formSpecType>;

const contextSpecType = t.partial({
  pid: t.number,
  sku: t.number,
  tensor: t.string,
  default: t.array(t.string),
  forms: t.array(formSpecType),
  tags: t.array(t.string),
  type: ItemTypeType,
});
export type ContextSpec = t.TypeOf<typeof contextSpecType>;

const itemSpecType = t.type({
  name: t.string,
  aliases: t.array(t.string),
});
export type ItemSpec = t.TypeOf<typeof itemSpecType>;

type GroupSpecType = ContextSpec & ({ items: GroupSpecType[] } | ItemSpec);

const groupSpecType: t.Type<GroupSpecType> = t.recursion('groupSpecType', () =>
  t.intersection([
    contextSpecType,
    t.union([
      t.type({
        items: t.array(groupSpecType),
      }),
      itemSpecType,
    ]),
  ])
);
export type GroupSpec = t.TypeOf<typeof groupSpecType>;

///////////////////////////////////////////////////////////////////////////////
//
// Rules
//
///////////////////////////////////////////////////////////////////////////////
const parentChildRuleType = t.intersection([
  t.type({
    parents: t.array(t.string),
    children: t.array(t.string),
  }),
  t.partial({
    info: t.type({
      defaultQty: t.number,
      minQty: t.number,
      maxQty: t.number,
    }),
  }),
]);

const exclusiveRuleType = t.type({
  parents: t.array(t.string),
  exclusive: t.array(t.string),
});

const anyRuleType = t.union([parentChildRuleType, exclusiveRuleType]);
export type AnyRule = t.TypeOf<typeof anyRuleType>;

///////////////////////////////////////////////////////////////////////////////
//
// Recipes
//
///////////////////////////////////////////////////////////////////////////////
export interface ItemTemplateSpec {
  name: string;
  quantity: number;
  children: ItemTemplateSpec[];
}

export const itemTemplateSpecType: t.Type<ItemTemplateSpec> = t.recursion(
  'ItemTemplateSpec',
  () =>
    t.type({
      name: t.string,
      quantity: t.number,
      children: t.array(itemTemplateSpecType),
    })
);

export const recipeSpecType = t.type({
  name: t.string,
  aliases: t.array(t.string),
  items: t.array(itemTemplateSpecType),
});
export type RecipeSpec = t.TypeOf<typeof recipeSpecType>;

///////////////////////////////////////////////////////////////////////////////
//
// Catalog
//
///////////////////////////////////////////////////////////////////////////////
export const catalogSpecType = t.type({
  dimensions: t.array(dimensionSpecType),
  tensors: t.array(tensorSpecType),
  catalog: t.array(groupSpecType),
  rules: t.array(anyRuleType),
  recipes: t.array(recipeSpecType),
});
export type CatalogSpec = t.TypeOf<typeof catalogSpecType>;

export const partialCatalogSpecType = t.intersection([
  t.partial(catalogSpecType.props),
  t.partial({
    imports: t.array(t.string),
  }),
]);
export type PartialCatalogSpec = t.TypeOf<typeof partialCatalogSpecType>;
