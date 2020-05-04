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
// Group
//
///////////////////////////////////////////////////////////////////////////////
const itemSpecType = t.type({
    name: t.string,
    aliases: t.array(t.string),
});
export type ItemSpec = t.TypeOf<typeof itemSpecType>;

const includeFormType = t.type({
    include: t.array(t.string),
});
const excludeFormType = t.type({
    exclude: t.array(t.string),
});
const formSpecType = t.union([includeFormType, excludeFormType]);
export type FormSpec = t.TypeOf<typeof formSpecType>;

const groupSpecType = t.intersection([
    t.type({
        tensor: t.string,
        default: t.array(t.string),
        items: t.array(itemSpecType),
        forms: t.array(formSpecType),
    }),
    t.partial({
        tags: t.array(t.string),
    }),
]);
export type GroupSpec = t.TypeOf<typeof groupSpecType>;

// ///////////////////////////////////////////////////////////////////////////////
// //
// // Forms
// //
// ///////////////////////////////////////////////////////////////////////////////
// const formType = t.array(t.string);
// const includeFormType = t.type({
//     include: formType,
// });
// const excludeFormType = t.type({
//     exclude: formType,
// });
// const formSetType = t.array(t.union([includeFormType, excludeFormType]));

// ///////////////////////////////////////////////////////////////////////////////
// //
// // Generic Entities
// //
// ///////////////////////////////////////////////////////////////////////////////
// const genericEntityType = t.type({
//     // pid: t.number,
//     name: t.string,
//     tags: t.string,
//     tensor: t.string,
//     forms: formSetType,
//     default: formType,
//     aliases: t.array(t.string),
// });

// export type GenericEntity = t.TypeOf<typeof genericEntityType>;


// ///////////////////////////////////////////////////////////////////////////////
// //
// // Specific Entities
// //
// ///////////////////////////////////////////////////////////////////////////////
// const specificEntityType = t.type({
//     // name: t.string,
//     // tags: t.string,
//     // key: t.string,
//     form: formType,
//     sku: t.string,
// });

///////////////////////////////////////////////////////////////////////////////
//
// Catalog
//
///////////////////////////////////////////////////////////////////////////////
export const catalogSpecType = t.type({
    dimensions: t.array(dimensionSpecType),
    tensors: t.array(tensorSpecType),
    catalog: t.array(groupSpecType),
});
export type CatalogSpec = t.TypeOf<typeof catalogSpecType>;


