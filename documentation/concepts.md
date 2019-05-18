# Prix-Fixe Concepts

## Menu Schema

## Generic and Specific Entities and their Attributes

### Catalog

`Catalogs` hold information about `generic` and `specific entities`. The entities may correspond to `Products` or `Options`. The `Catalog's` YAML representation looks like

~~~
{
    genericItems: GenericEntity[]
    specificItems: SpecificEntity[]
}
~~~

The `Catalog` class provides methods for inspecting its contents:
* hasPID(pid: PID) - returns true if the catalog contains a `generic entitiy` with the specified `PID`.
* getGeneric(pid: PID) - returns the `generic product` with the specified `PID`.
* hasKey(key: KEY) - returns true if the catalog contains a `specific entity` with the specified `KEY`.
* getSpecific(key: KEY) - returns the `specific product` with the specified `KEY`.
* getTensorFromPID(pid: PID) - returns the id of the tensor associated with the `generic product` with the specified `PID`.
* genericProducts() - iterator of all `generic entities` in the catalog.
* specificProducts() - iterator of all `specific entities` in the catalog.

## Products

### Generic Products

A `generic product` represents a class of related products that can be customized to specific products with the application of attributes. For example, an `ice cream cone` might be a generic product that could be specialized with SKU-specifying attributes like
* Size: `small`, `medium`, and `large`
* Type: `soft serve`, `hand packed`
* Flavor: `chocolate`, `strawberry`, and `vanilla`

In the `Catalog`, a generic product is represented by the `GenericEntity` interface:
~~~
export interface GenericEntity extends Entity {
    pid: PID;
    cid: CID;
    aliases: string[];
    tensor: TID;
    defaultKey: KEY;
}
~~~

The `GenericEntity` fields are as follows:
* `pid`: an integer product identifier that is unique across all generic products.
* `cid`: an integer category identifier. **TODO**: more on this later.
* `aliases`: an array of alias generator expressions for the phrases that represent this entity. Continuing the ice cream example, the aliases for `ice cream cone` might include
    * ice cream
    * ice cream cone
    * cone
* `tensor`: a tensor mapping attribute combinations to specific product keys. In the ince cream example, the tensor would have dimensions corresponding to `size`, `type`, and `flavor`. Note that each generic product can have its own tensor. So, for example, a generic coffee product might specify a two dimensional tensor with `size` and `caffiene` dimensions.
* `defaultKey`: the key of the specific product when no attributes are specified. This key is used to provide default values of each unspecified attribute.

### Specific Products

A `specific product` represents a specialization of a `generic product`. Unlike its generic cousin, the `specific product` has a `SKU` and can be purchased.

In the `Catalog`, a specific product is represented by the `SpecificEntity` interface:
~~~
export interface SpecificEntity extends Entity {
    sku: SKU;
    key: KEY;
}
~~~
The `SpecificEntity` fields are as follows:
* sku: the entity's `stock keeping unit` code. Note that `prix-fixe` does not use the `SKU` as an index key for `SpecificEntities`.
* key: a string representation of the product's coordinates in the tensor. The form is `P:X:Y:Z` where `P` is the products generic PID and `X`, `Y`, `Z` are its coordinates in its tensor space. Note that the key will have as many coordinate components as tensor dimensions. Some products aren't configured by attributes, and therefor are associated with a zero-dimensional tensor. Other products may have one, two, three, or more coordinate components.

Note that `SpecificEntity` does not specify aliases. These are provided by the `GenericEntity`.

## Dimensions, Attributes and Tensors
The `attributes.yaml` file specifies `Dimensions`, `Attributes`, and `Tensors`:
~~~
export interface Attributes {
    dimensions: DimensionDescription[];
    matrices: MatrixDescription[];
}
~~~

### Dimensions
A `Dimension` is a set of related, but mutually exclusive attributes. In the examples, above, `size`, `type`, and `flavor` are all dimensions.

~~~
export interface DimensionDescription {
    did: DID;
    name: string;
    items: AttributeItem[];
}
~~~

The fields of `DimensionDescription` are as follows:
* did - an integer dimension identifier that is unique across all dimensions.
* name - a friendly name for the dimension. This name is not intended to be used by NLP algorithms to recognize dimensions, but it might be used to generate text to prompt the customer to provide a value for a dimension. For example, "what size cone would you like?".
* items: an array of `AttributeItems` that make up the dimension. For example, a `size` dimension might have entries for `small`, `medium`, and `large`.

### Attributes

~~~
export interface AttributeDescription {
    aid: AID;
    name: string;
    aliases: string[];
    hidden?: boolean;
}
~~~

The `AttributeDescription` fields are as follows:
* aid: an integer attribute identifier that is unique across all attributes.
* name: a friendly name for the attribute. Note that the name is not intended to be used by NLP algorithms that recognize attributes.
* aliases: an array of alias generator expressions for the phrases that represent this attribute. In a coffee ordering scenario, the `medium` size attirbute might specify the following aliases:
    * medium
    * grande
* hidden - specifies whether this field should be displayed as part of the specific item's name. In many cases, the default attribute is not displayed. For example, coffee might have `iced` and `hot` attributes, but the `hot` attribute would not be printed.

### Tensors

~~~
export interface TensorDescription {
    tid: TID;
    name: string;
    dimensions: DID[];
}
~~~

The fields of the `TensorDescription` are as follows:
* tid: an integer tensor identifier that is unique across all tensors.
* name: a friendly name for the tensor, e.g. `sizes`, `flavors`, etc.
* dimensions: an array of identifers of the tensor's dimensions.

## Options
`Options` are product modifications that are added as children of a product.
As with products, options can be quantified, and generic options can be specialized with attributes.

### Generic Options
`Generic options` are analogous to `generic products`.
A `generic option` represents a class of related options that can be customized to specific options with the application of attributes. For example, an `chocolate syrup` might be a generic product that could be specialized with SKU-specifying attributes like
* Quantity: `no`, `light`, `extra`

In some cases an attribute might specify that the option is quantifed with a number, e.g. `five pumps of chocolate syrup`.

In the `Catalog`, a generic option is represented by the `GenericEntity` interface described earlier in the section on `Generic Products`.

### Specific Options
A `specific option` represents a specialization of a `generic option`. Unlike its generic cousin, the `specific option` has a `SKU` and can be used to customize a `specific product`.

In the `Catalog`, a specific product is represented by the `SpecificEntity` interface.

### Modifiers
`Modifiers` are `Options` that are mutually exclusive, within a set. For example, when ordering a latte, a customer might express a milk preference that could be one of `non fat`, `two percent`, `whole milk`, or `soy milk`.

## Rules

## <a name="aliases"></a>Aliases
Aliases are used to configure the NLP system to recognized `products`, `options`, and `attributes`. 

The `prix-fixe` alias generator supports a few constructs to simplify the job of writing aliases:
* optional: a comma-separated list of phrases inside square brackets is treated an a choice of zero or one phrase from the list. So, the pattern `"chicago [combo,meal]"` would match any of the following:
    * chicago
    * chicago combo
    * chicago meal
* choose exactly one: a comma-separated list of phrases inside parentheses is treated as a choice of exactly one phrase from the list. So the pattern, `"(iced,sweet) tea"` would match
    * iced tea
    * sweet tea

Note that you cannot nest either of these constructs.

The `generateAliases()` function generates all of the aliases associated with a specified pattern.

~~~
export const generateAliases: (pattern: string) => IterableIterator<string>;
~~~