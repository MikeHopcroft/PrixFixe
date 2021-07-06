# Interactive Menu Explorer

The `prix-fixe` menu defines a set of `products`, `options`, and `attributes`, along with `rules` for combining these elements into
the fully specified items that make up an order.
The best way to see `prix-fixe` in action is through 
its interactive `Menu Explorer`.

This tool allows us to browse and examine the menu and it provides functionality for authoring test suites that can be used to evaluate natural language systems that generate orders based on multi-turn conversations.

Let's use this tool to examine the sample menu in [samples/menu](../samples/menu).

## Getting Started

Before using the menu explorer, we must build or install `prix-fixe`.

`prix-fixe` is a [Node.js](https://nodejs.org/en/) project,
written in [TypeScript](https://www.typescriptlang.org/).
In order to use `prix-fixe` you must have
[Node](https://nodejs.org/en/download/) installed on your machine.
`prix-fixe` has been tested with Node version [13.7.0](https://nodejs.org/download/release/v13.7.0/).

~~~
% git clone git@github.com:MikeHopcroft/PrixFixe.git
% cd PrixFixe
% npm install
% npm run compile
~~~

## Running the Menu Explorer
Use the `node` command to start up the menu explorer. The sample menu will be loaded by default. You can use the `-d` command-line argument to load a different menu.

Note that we're in the process of transitioning to a new menu format. We use '-x' flag to enable support for this format, which is used by the [sample menu](sample_menu).


[//]: # (interactive one > node build/samples/repl.js -x -h)
~~~
// $ node build/samples/repl.js -x
// 
// Loaded prix-fixe extension.
// Loaded short-order extension.
//   Registering so processor: short-order
// Current processor is short-order.
// 
// Welcome to the ShortOrder REPL.
// Type your order below.
// A blank line exits.
// 
// Type .help for information on commands.
// 
// % #
~~~

We're now in the Read-Eval-Print-Loop (REPL) and can type commands after the prompt. 
Let's take a look at the menu. We'll use the `.products` command to display the list of products in the menu:

[//]: # (interactive one > node build/samples/repl.js -x -h)
~~~
% .products
% #
~~~
Each product name is followed by its product id or `PID`. We drilldown on the specifics of a product by passing its `PID` to the `.products` command. Let's look at the `latte` product whose `PID` is `302`:

[//]: # (repl)
~~~
% .products 302
% #
~~~

This command returned a huge amount of information. Let's go through it section-by-section:
* **Aliases** - this is a list of word tuples that represent ways of saying the name of the product. Note that aliases cannot always be inferred from the product's formal name. Sometimes products have alterntive names that don't have any apparent relationship to formt name. An example would be a `"House Special"`, which might be the same as a `"Petaluma Chicken Sandwich"`.
* **Attributes** - This is the set of attributes whose values specify the `SKU` of the fully configured product. Attributes are organized into dimensions, and each attribute specifies a number of aliases. This example shows six attributes, organized into two dimensions, corresponding to temperature and size.
* **Specifics** - This is the list of fully configured versions of the product. Note that not all combinations of attributes are legal. In this example, the `short iced` and `venti hot` forms are not legal. Note that `grande latte` is marked as the default form that is implied when no attributes are specified. Each specific form is followed by its `KEY` and then its `SKU`. The `KEY` combines the `PID` with coordinates into the attributes tensor. For example, the `"short latte"` has `KEY=3:0:0`, implying `PID=3` and `hot` and `short`. Its `SKU` is `600`.
* **Options** - This is the list of options that are legal for the product. We can examine any of the options with the `.options` command.
* **Exclusion Sets** - Some options are mutually exclusive. In this case, a latte can only specify one type of milk and one caffeine level. It can be for here or to go and it can be either wet or dry.

Now let's use the `.options` command to drill down on the `foam` option. It's `PID` is `1001`:

[//]: # (repl)
~~~
% .options 1001
% #
~~~
We can see that the `foam` option is a bit simpler than the `latte` product, but it still has an attribute to specify the quantity of foam.

Note that we can also use the `.aliases`, `.exclusions`, and `.specifics` commands if we only want to see a slice of information about a product or an option:

[//]: # (repl)
~~~
% .aliases 302
% .specifics 1001
% .exclusions 501
~~~

## Forming Orders
The `Menu Explorer` provides a rudamentory text processor that can be used to put together orders, which serve as a building block for test suites. The text processor supports the following syntax for adding a product to the order or adding an option to the most recently added product:
~~~
add [one|two|three] <specific product name>
~~~

Here are some examples:

[//]: # (repl)
~~~
% add two iced grande latte
% add light foam
% add apple bran muffin
~~~

The text processor supports the following syntax to remove a product or option:
~~~
remove <specific product name>
~~~

Here are some examples:

[//]: # (repl)
~~~
% remove light foam
% remove iced grande latte
% remove apple bran muffin
% #
~~~

## Measuring Repair Cost
The `Menu Explorer` can calculate the repair cost to convert an observed cart into an expected cart. To use this feature, you must first construct an expected cart and then record it with the `.expect` command:

[//]: # (repl)
~~~
% add two iced tall mocha
% add decaf
% add three vanilla syrup
% .expect
~~~

The `.score` command compares the current cart with the expected cart. Right now the carts are the same:

[//]: # (repl)
~~~
% .score
~~~

Let's see what happens if we remove the decaf from the cart and then score:

[//]: # (repl)
~~~
% remove decaf
% .score
~~~

Now let's change the quantity of the vanilla syrup:

[//]: # (repl)
~~~
% remove vanilla syrup
% add two vanilla syrup
% .score
~~~

Now let's use the `.reset` command to remove everything from the cart and then add a muffin:

[//]: # (repl)
~~~
% .reset
% add apple bran muffin
% .score
~~~

## Authoring Test Cases
The `Menu Explorer` includes commands for authoring test suites that can be used to [evaluate `text-to-order`](./test_suite_tools.md) systems. The process involves the following steps:

1. Use the `.newtest` command to start a test.
1. For each step in the conversation
    * Use the `.step` command to record the text input.
    * Use the `add` and `remove` syntax, along with the `.reset` and `.undo` commands to construct the expected cart.
1. Optionally use the `.suites` command to tag the test with suite names.
1. Optionally use the `.comment` command to add a text comment to the test.
1. Use the `.yaml` command to print out the YAML representation of the test.

Let's create the test for the following three-step order:
* _"hi um i'd ah like a tall flat white"_
* _"actually can you make that iced and decaf"_
* _"and get me a warm bran muffin that's all"_

We start the test with the `.newtest` command and then use `.step` to record the text.

[//]: # (repl)
~~~
% .newtest
% .step hi um i'd like a tall flat white
~~~

Now we have to construct the cart for this step:

[//]: # (repl)
~~~
% add tall flat white
~~~

In the second step, we have to do a bit more work to update the cart:

[//]: # (repl)
~~~
% .step actually can you make that iced and decaf
% .reset
% add iced tall flat white
% add decaf
~~~

Here's the third step:

[//]: # (repl)
~~~
% .step and get me a warm bran muffin that's all
% add apple bran muffin
% add warmed
~~~

Now let's add some suite tags and a comment and then generate the YAML:

[//]: # (repl)
~~~
% .suites standard example
% .comment a simple, three-step order
% .yaml
~~~

Once you have a YAML test suite, you can use it with the `filter_suite` and
`evaluate` commands.

## Extending the Menu Explorer

THIS SECTION IS STILL A WORK IN PROGRESS

We've seen that the `Menu Explorer` includes a rudamentary text processor that supports adding and removing products and options.

We can easily extend the `Menu Explorer` to use a more sophisticated, custom text processor, perhaps based on machine learning and language models.

A `Processor` is a function that takes a `State` and some text as input and returns a `Promise` for a new `State`. The `Processor` returns a `Promise` to allow the `Processor` to make asynchronous calls to external services. Here's the function signature:
~~~
type Processor = (text: string, state: State) => Promise<State>;
~~~

A `State` consists of a `Cart`, which holds a seqeunce of `ItemInstance` trees. Here are the relevant data structures:
~~~
/**
 * Unique instance identfier. No two ItemInstances/child ItemInstances can share
 * a UID. Used by React-like libraries that need to detect changes in data
 * structures.
 */
export type UID = number;

export interface ItemInstance {
    uid: UID;
    key: Key;
    quantity: number;
    children: ItemInstance[];
}

export interface Cart {
    items: ItemInstance[];
}

export interface State {
    cart: Cart;
}
~~~

TODO:
* Explain how to provide the processor.
* Use convenience method that creates the factory and repl extension.
