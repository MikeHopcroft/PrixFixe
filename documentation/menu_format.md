# Catalog File Format

The [prix-fixe]() catalog describes items that can be ordered and their legal configurations. The menu consists of at least one [YAML]() file, which may stand alone or import other YAML files with catalog fragments.

A catalog file is structured as a single object with optional fields for `imports`, `dimensions`, `tensors`, `items`, `rules`, and `recipes`.

## Imports
For modularity, [prix-fixe]() models the catalog as a collection of catalog fragments, linked together by `imports blocks`. The root catalog file may import other catalog files which, in turn, can link additional files. Note that imports are optional. It is permissable to store the entire catalog in a single file.

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
`Attributes` are product characteristics that configure a `generic product class` into a `specific product` with a SKU. `Attributes` in [prix-fixe]() are organized into `dimensions`.

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

The attribute `name` must be unique across all attributes in the catalog. The `aliases` field provides generator expression that defines phrases associated with the attribute. We'll going in to more detail on generator expressions [below](). For now it suffices to know that the `aliases` are the sole repository for identifying phrases. The `name` field exists to provide a unique identifier for referencing attributes within the catalog file. It is also used to synthesize `specific product` names.

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

| Field  | Purpose  | Default  | Repair |
|---|:-:|:-:|:-:|
| tags | the tags blah blah blah | [ ] | |

### Tags
The rules system uses `tags` to refer to sets of products. As an example, we might allow all products tagged with `creamers` to be children of products tagged with `coffees`. As another example, we might place all of the caffeination levels in the same mutual exclusion class, using the `caffeine` tag.

### Tensor
* Name
* Dimensions
### Default
### Forms
* Include
* Exclude
### Items
* Name
* Aliases
* Type
* Role
* Default
* Units

## Rules

### Parent-Child
### Exclusion

## Recipes
* name
* aliases
* items
  * name
  * quantity
  * children