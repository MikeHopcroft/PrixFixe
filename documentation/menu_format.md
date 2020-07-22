# Catalog File Format

The [prix-fixe](https://github.com/MikeHopcroft/prixfixe) catalog describes items that can be ordered and their legal configurations. The menu consists of at least one [YAML]() file, which may stand alone or import other YAML files with catalog fragments.

A catalog file is structured as a single object with optional fields for `imports`, `dimensions`, `tensors`, `items`, `rules`, and `recipes`.

## Imports
For modularity, [prix-fixe](https://github.com/MikeHopcroft/prixfixe) models the catalog as a collection of catalog fragments, linked together by `imports blocks`. The root catalog file may import other catalog files which, in turn, can link additional files. Note that imports are optional. It is permissable to store the entire catalog in a single file.

~~~
{
  imports?: string[];
}
~~~

Here is a catalog, organized by type of item:
~~~
imports:
  - bakery.yaml
  - coffee.yaml
~~~

Here is a catalog, organized by declaration type:
~~~
imports:
  - dimensions.yaml
  - tensors.yaml
  - items.yaml
  - rules.yaml
  - recipes.yaml
~~~

Note that the filenames in the import blocks are relative to the location of the importing catalog file.

**TODO:** Note on how imported files are merged.

## Dimensions
`Attributes` are product characteristics that configure a `generic product class` into a `specific product` with a SKU. `Attributes` in [prix-fixe](https://github.com/MikeHopcroft/prixfixe) are organized into `dimensions`.

The optional 'dimensions block` consists of an array of dimension specifications, each of which consists of a `name` and a set of attribute specifications:

~~~
{
  dimensions?: Array<
    {
      name: string;
      attributes: Array<
        name: string;
        aliases: string[];
        hidden?: boolean;
      >;
    }
  >;
}
~~~

The dimension `name` must be unique across all dimensions. 

Each attribute definition consists of a `name`, a set of `aliases`, and an optional `hidden` flag. 

The attribute `name` must be unique across all attributes in the catalog. The `aliases` field provides generator expression that defines phrases associated with the attribute. We'll going in to more detail on generator expressions [below](#generator-expressions). For now it suffices to know that the `aliases` are the sole repository for identifying phrases. The `name` field exists to provide a unique identifier for referencing attributes within the catalog file. It is also used to synthesize `specific product` names.

The `hidden` flag specifies whether the attribute should appear in a synthesized product name. As an example, consider a coffee drink that is configured with a choice of `hot` or `iced`. If the `hot` attribute were marked as hidden, the specific form would be `coffee`, instead of `hot coffee`.

Note that the `hidden` concept is related to, but not the same as the `default` configuration concept, below. Typically `hidden` forms are also `default` forms, but this is not a hard and fast rule.

Here's an example `dimensions block`:

~~~
dimensions:
  - name: coffee_temperature
    attributes:
      - name: hot
        hidden: true
        aliases:
          - hot
          - not iced
      - name: iced
        aliases:
          - iced
  - name: coffee_size
    attributes:
      - name: short
        aliases:
          - short
          - "(kid,kid's,child) [size]"
      - name: tall
        aliases:
          - tall
          - small
      - name: grande
        aliases:
          - grande
          - medium
      - name: venti
        aliases:
          - venti
          - large
~~~

## Tensors
`Tensors` define sets of `dimensions` that configure a particular class of generic products. The `tensors` block provides a sequence of tensor definitions, each of which consists of a `name`, and an array of `dimension names`:

~~~
{
  tensors?: Array<
    {
      name: string;
      dimensions: string[];
    }
  >;
}
~~~

The following block defines three tensors:

~~~
tensors:
  - name: latte_drinks
    dimensions: [coffee_temperature, coffee_size]
  - name: espresso_drinks
    dimensions: [coffee_temperature, espresso_size]
  - name: options
    dimensions: [option_quantity]
~~~

## Catalog

The `Catalog` defines generic products. It is organized a tree whose interior nodes provide values that apply to their descendents. Descendend nodes can override any value provided by an ancestor node. Leaf nodes are distinguished in that they also provide an item's name and its aliases.

The tree structure allows one to simplify the catalog by grouping products based on characteristics they have in common. As an example, one could place all of the latte-like drinks under a single node that specifies the `latte_drinks` tensor. 

Here are they type definitions for the `Catalog` tree. All nodes may include optional properties from `ContextSpec`. Leaf nodes must also include properties from `ItemSpec`.
~~~
interface ContextSpec {
  // Type of products in this context.
  type?: 'product' | 'option';

  // Initial value for PIDs generated in this context.
  pid?: number;

  // Initial value for SKUs generated in this context.
  sku?: number;

  // Attribute system configuration
  tensor?: string;
  default?: string[];
  forms?: Array<{ include: string[] | exclude: string[] }>;

  // Tags applied to items in the context.
  // Used to reference sets of products when configuring rules.
  tags?: string[];

  // Optional fuzzer hints
  units?: string;
  role?: 'any' | 'applied' | 'counted' | 'measured';
}

interface ItemSpec {
  name: string;
  aliases: string[];
}

type GroupSpec = ContextSpec & ({items: GroupSpec[]} | ItemSpec);

interface CatalogBlock {
  catalog?: GroupSpec;
}
~~~

Let's look at each of the `ContextSpec` fields.

| Field  | Purpose  | Default  |
|---|:--|:-:|:-:|
| tags | A list of tags to be applied to each descendant item. Each tag is a string identifier for a set that contains each of the tagged items. | [ ] |
| tensor | The name of the tensor that configures descendent items. | none |
| default | The default form for descendent items. Defined as an array of attribute names for each dimension in the tensor. | tensor origin |
| forms | A sequence of include and exclude clauses that define legal tensor coordinates. Accepts that `*` wildcard designator. | [*, *, ...] |
| items | Leaf nodes in this subtree define menu itam | required field |


### Tags
The rules system uses `tags` to refer to sets of products. As an example, we might allow all products tagged with `creamers` to be children of products tagged with `coffees`. As another example, we might place all of the caffeination levels in the same mutual exclusion class, using the `caffeine` tag.

### Tensor - TODO
* Name
* Dimensions
### Default - TODO
### Forms - TODO
* Include
* Exclude
### Items - TODO
* Name
* Aliases
* Type
* Role
* Default
* Units

## Rules

The system currently supports two types of rules, one governing parent-child relationships, and the other governing sibling-sibling relationships.

### Parent-Child

This rule defines the legal children for a set of parents. The set of parents is the union of the products associated with tags in the `parents` field. The set of children is the union of the products associated with the tags in the `children` field. An optional `info` field defines minimum, maximum, and default allowable quantities.

Here is the type:
~~~
interface ParentChildRule {
  parents: string[];
  children: string[];
  info?: {
    defaultQty: number;
    minQty: number;
    maxQty: number;
  };
}
~~~

Here is an example from `coffee.yaml`:
~~~
rules:
  - parents: [latte_drinks]
    children: 
      - milks
      - sweeteners
      - syrups
      - toppings
  - parents: [latte_drinks, coffee_drinks, espresso_drinks]
    children:
      - caffeines
      - here-or-to-go
      - latte_preparations
      - wet-or-dry
    info:
      minQty: 1
      maxQty: 1
      defaultQty: 1
  - parents: [coffee_drinks, espresso_drinks]
    children: 
      - creamers
      - sweeteners
      - syrups
      - toppings
~~~

### Exclusion

This rule defines mutual exclusion sets for siblings. Mutual exclusivity is important for concepts like `here` vs. `to go` or `decaf` vs `half caf`.

The rule applies to children of certain parents. The set of parents is defined as the union of the products associated with tags in the `parents` field.

Each tag in the `exclusive` field defines a mutual exclusion set amongst the items associate with the tag. Note that each tag corresponds to a distinct exclusion set, so in the example, below, `milks` is one exclusion set and `caffeines` is another. This behavior is different from the parent/child relation which unions up all of the items assocated with all of the tags.

Here is the type:
~~~
interface ExclusiveRule {
  parents: string[];
  exclusive: string[];
}
~~~

Here's an example:
~~~
rules:
  - parents: [coffee_drinks, espresso_drinks, latte_drinks]
    exclusive: [milks, caffeines, here-or-to-go, wet-or-dry]
~~~

## Recipes

TODO: write this section

* name
* aliases
* items
  * name
  * quantity
  * children

## Generator Expressions

The `token-flow` alias generator supports a few constructs to simplify the job of writing aliases:
* **optional**: a comma-separated list of phrases inside square brackets is treated an a choice of zero or one phrase from the list. So, the pattern `"chicago [combo,meal]"` would match any of the following:
    * chicago
    * chicago combo
    * chicago meal
* **choose exactly one**: a comma-separated list of phrases inside parentheses is treated as a choice of exactly one phrase from the list. So the pattern, `"(iced,sweet) tea"` would match
    * iced tea
    * sweet tea

Note that you cannot nest either of these constructs.

The `token-flow` alias generator also allows one to specify the matching algorithm on a per-alias basis. The algorithm is selected by the `exact:`, `prefix:`, and `relaxed:` keywords at the beginning of the phrase.
* exact - only consider exact matches. The only matches for "New York City"` is
    * New York City
* prefix - only consider matches to a prefix of the pattern. Prefix matches for `"New York City"` would include
    * New
    * New York
    * New York City
* relaxed - considers matches with insertions, deletions, and transpositions. Relaxed matches for `"New York City"` might include
    * New City
    * York City
    as well as some of the other matches.
