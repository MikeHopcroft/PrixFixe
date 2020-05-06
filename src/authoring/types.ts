import * as t from 'io-ts';

export type AID = number;
export type DID = number;
export type Key = string;
// export type PID = number;
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
// TagGroups
//
///////////////////////////////////////////////////////////////////////////////
// interface TagGroupSpecType {
//     members: TagGroupSpecType | TensorGroupSpec;
//     tag?: string;
// }

// const tagGroupSpecType: t.Type<TagGroupSpecType> = t.recursion(
//     'tagGroupSpecType',
//     () => t.intersection([
//         t.type({
//             members: t.union([tagGroupSpecType, tensorGroupSpecType]),
//         }),
//         t.partial({
//             tags: t.array(t.string),
//         }),
//     ])        
// );
// export type TagGroupSpec = t.TypeOf<typeof tagGroupSpecType>;

///////////////////////////////////////////////////////////////////////////////
//
// TensorGroups
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

// interface GroupNodeType {
//     items: Array<ItemSpec | GroupNodeType>,
// }

// const groupNodeType: t.Type<GroupNodeType> = t.recursion(
//     'groupNodeType',
//     () => t.type({
//         items: t.array(t.union([groupNodeType, itemSpecType])),
//     })
// );

interface GroupSpecType {
    items: Array<ItemSpec | GroupSpecType>;
    tensor: string;
    default: string[];
    forms: FormSpec[];
    tags?: string[];
}

const groupSpecType: t.Type<GroupSpecType> = t.recursion(
    'groupSpecType',
    () => t.intersection([
        t.type({
            items: t.array(t.union([groupSpecType, itemSpecType])),
            tensor: t.string,
            default: t.array(t.string),
            forms: t.array(formSpecType),
        }),
        t.partial({
            tags: t.array(t.string),
        }),
    ])
);
export type GroupSpec = t.TypeOf<typeof groupSpecType>;

// const tensorGroupSpecType = t.intersection([
//     t.type({
//         tensor: t.string,
//         default: t.array(t.string),
//         items: t.array(itemSpecType),
//         forms: t.array(formSpecType),
//     }),
//     t.partial({
//         tags: t.array(t.string),
//     }),
// ]);
// export type TensorGroupSpec = t.TypeOf<typeof tensorGroupSpecType>;

///////////////////////////////////////////////////////////////////////////////
//
// AnyGroup
//
///////////////////////////////////////////////////////////////////////////////
// const anyGroupSpecType = t.union([
//     tagGroupSpecType,
//     tensorGroupSpecType,
// ]);
// export type AnyGroup = t.TypeOf<typeof anyGroupSpecType>;

///////////////////////////////////////////////////////////////////////////////
//
// Rules
//
///////////////////////////////////////////////////////////////////////////////
const parentChildRuleType = t.type({
    parents: t.array(t.string),
    children: t.array(t.string),
});

const exclusiveRuleType = t.type({
    parents: t.array(t.string),
    exclusive: t.array(t.string),
});

const anyRuleType = t.union([
    parentChildRuleType,
    exclusiveRuleType,
]);
export type AnyRule = t.TypeOf<typeof anyRuleType>;

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
});
export type CatalogSpec = t.TypeOf<typeof catalogSpecType>;


