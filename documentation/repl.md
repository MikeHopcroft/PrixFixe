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
$ git clone git@github.com:MikeHopcroft/PrixFixe.git
$ cd PrixFixe
$ npm install
$ npm run compile
~~~

## Running the Menu Explorer
Use the `node` command to start up the menu explorer. The sample menu will be loaded by default. You can use the `-d` command-line argument to load a different menu.

Note that we're in the process of transitioning to a new menu format. We use '-x' flag to enable support for this format, which is used by the [sample menu](sample_menu).

[//]: # (iscript one % menu -x)
[//]: # (invocation $ menu -x)
~~~
$ menu -x

Loaded prix-fixe extension.
Loaded simple extension.

Welcome to the PrixFixe REPL.
Type your order below.
A blank line exits.

Type .help for information on commands.

%
~~~

We're now in the Read-Eval-Print-Loop (REPL) and can type commands after the prompt. 
Let's take a look at the menu. We'll use the `.products` command to display the list of products in the menu:

[//]: # (iscript one % menu -x)
~~~
% .products
apple bran muffin (2000)
blueberry muffin (2001)
lemon poppyseed muffin (2002)
cappuccino (300)
flat white (301)
latte (302)
latte macchiato (303)
mocha (304)
chai latte (305)
espresso (400)
lungo (401)
ristretto (402)
macchiato (403)
americano (500)
dark roast coffee (501)
 
~~~
Each product name is followed by its product id or `PID`. We drilldown on the specifics of a product by passing its `PID` to the `.products` command. Let's look at the `latte` product whose `PID` is `302`:

[//]: # (iscript one % menu -x)
~~~
% .products 302
latte (302)
  Aliases:
    caffe latte
    latte
  Attributes:
    coffee_temperature
      hot (0)
        hot
        not iced
      iced (1)
        iced
    coffee_size
      short (0)
        child
        child size
        kid
        kid size
        kid's
        kid's size
        short
      tall (1)
        small
        tall
      grande (2)
        grande
        medium
      venti (3)
        large
        venti
  Specifics:
    short latte (302:0:0, 600)
    tall latte (302:0:1, 601)
    grande latte (302:0:2, 602) <== default
    iced tall latte (302:1:1, 603)
    iced grande latte (302:1:2, 604)
    iced venti latte (302:1:3, 605)
  Options for grande latte:
    almond milk (806)
    almond syrup (600)
    buttered rum syrup (601)
    caramel syrup (602)
    cinnamon (1000)
    cinnamon syrup (603)
    coconut milk (804)
    decaf (704)
    dry (1104)
    eggnog (808)
    equal (1200)
    espresso shot (1206)
    foam (1001)
    for here cup (1100)
    half caf (702)
    hazelnut syrup (604)
    honey (1201)
    ice (1002)
    lid (1101)
    nonfat milk (803)
    nutmeg (1003)
    oat milk (807)
    one percent milk (802)
    one third caf (703)
    orange syrup (605)
    peppermint syrup (606)
    raspberry syrup (607)
    regular (700)
    soy milk (805)
    splenda (1202)
    sugar (1203)
    sugar in the raw (1204)
    sweet n low (1205)
    to go (1103)
    toffee syrup (608)
    two percent milk (801)
    two thirds caf (701)
    vanilla syrup (609)
    water (1005)
    wet (1105)
    whipped cream (1004)
    whole milk (800)
    with room (1102)
  Exclusion Set 0
    whole milk (800)
    two percent milk (801)
    one percent milk (802)
    nonfat milk (803)
    coconut milk (804)
    soy milk (805)
    almond milk (806)
    oat milk (807)
    eggnog (808)
  Exclusion Set 1
    regular (700)
    two thirds caf (701)
    half caf (702)
    one third caf (703)
    decaf (704)
  Exclusion Set 2
    for here cup (1100)
    to go (1103)
  Exclusion Set 3
    dry (1104)
    wet (1105)
 
%
~~~

This command returned a huge amount of information. Let's go through it section-by-section:
* **Aliases** - this is a list of word tuples that represent ways of saying the name of the product. Note that aliases cannot always be inferred from the product's formal name. Sometimes products have alterntive names that don't have any apparent relationship to formt name. An example would be a `"House Special"`, which might be the same as a `"Petaluma Chicken Sandwich"`.
* **Attributes** - This is the set of attributes whose values specify the `SKU` of the fully configured product. Attributes are organized into dimensions, and each attribute specifies a number of aliases. This example shows six attributes, organized into two dimensions, corresponding to temperature and size.
* **Specifics** - This is the list of fully configured versions of the product. Note that not all combinations of attributes are legal. In this example, the `short iced` and `venti hot` forms are not legal. Note that `grande latte` is marked as the default form that is implied when no attributes are specified. Each specific form is followed by its `KEY` and then its `SKU`. The `KEY` combines the `PID` with coordinates into the attributes tensor. For example, the `"short latte"` has `KEY=3:0:0`, implying `PID=3` and `hot` and `short`. Its `SKU` is `600`.
* **Options** - This is the list of options that are legal for the product. We can examine any of the options with the `.options` command.
* **Exclusion Sets** - Some options are mutually exclusive. In this case, a latte can only specify one type of milk and one caffeine level. It can be for here or to go and it can be either wet or dry.

Now let's use the `.options` command to drill down on the `foam` option. It's `PID` is `1001`:

[//]: # (iscript one % menu -x)
~~~
% .options 1001
foam (1001)
  Aliases:
    foam
  Attributes:
    option_quantity
      no (0)
        no
        with no
        without
      light (1)
        a little
        a little bit of
        easy
        easy on the
        just a little
        just a little bit of
        less
        light
        lightly
        slightly less
      regular (2)
        normal
        regular
      extra (3)
        added
        additional
        extra
        heavy
        heavy on the
        lots of
        more
  Specifics:
    no foam (1001:0, 5200)
    light foam (1001:1, 5201)
    foam (1001:2, 5202) <== default
    extra foam (1001:3, 5203)
  Options for foam:
 
%
~~~
We can see that the `foam` option is a bit simpler than the `latte` product, but it still has an attribute to specify the quantity of foam.

Note that we can also use the `.aliases`, `.exclusions`, and `.specifics` commands if we only want to see a slice of information about a product or an option:

[//]: # (iscript one % menu -x)
~~~
% .aliases 302
latte (302)
  Aliases:
    caffe latte
    latte
 
% .specifics 1001
  Specifics:
    no foam (1001:0, 5200)
    light foam (1001:1, 5201)
    foam (1001:2, 5202) <== default
    extra foam (1001:3, 5203)
 
% .exclusions 501
  Exclusion Set 0
    whole milk (800)
    two percent milk (801)
    one percent milk (802)
    nonfat milk (803)
    coconut milk (804)
    soy milk (805)
    almond milk (806)
    oat milk (807)
    eggnog (808)
  Exclusion Set 1
    regular (700)
    two thirds caf (701)
    half caf (702)
    one third caf (703)
    decaf (704)
  Exclusion Set 2
    for here cup (1100)
    to go (1103)
  Exclusion Set 3
    dry (1104)
    wet (1105)
 
%
~~~

## Forming Orders
The `Menu Explorer` provides a rudamentory text processor that can be used to put together orders, which serve as a building block for test suites. The text processor supports the following syntax for adding a product to the order or adding an option to the most recently added product:
~~~
add [one|two|three] <specific product name>
~~~

Here are some examples:

[//]: # (iscript one % menu -x)
~~~
% add two iced grande latte

  2 iced grande latte (604)                302:1:2

% add light foam

  2 iced grande latte (604)                302:1:2
    1 light foam (5201)                     1001:1

% add apple bran muffin

  2 iced grande latte (604)                302:1:2
    1 light foam (5201)                     1001:1
  1 apple bran muffin (10000)                 2000

~~~

The text processor supports the following syntax to remove a product or option:
~~~
remove <specific product name>
~~~

Here are some examples:

[//]: # (iscript one % menu -x)
~~~
% remove light foam

  2 iced grande latte (604)                302:1:2
  1 apple bran muffin (10000)                 2000

% remove iced grande latte

  1 apple bran muffin (10000)                 2000

% remove apple bran muffin


~~~

## Measuring Repair Cost
The `Menu Explorer` can calculate the repair cost to convert an observed cart into an expected cart. To use this feature, you must first construct an expected cart and then record it with the `.expect` command:

[//]: # (iscript one % menu -x)
~~~
% add two iced tall mocha

  2 iced tall mocha (803)                  304:1:1

% add decaf

  2 iced tall mocha (803)                  304:1:1
    1 decaf (3000)                             704

% add three vanilla syrup

  2 iced tall mocha (803)                  304:1:1
    1 decaf (3000)                             704
    3 vanilla syrup (2502)                   609:2

% .expect
Expected cart set
~~~

The `.score` command compares the current cart with the expected cart. Right now the carts are the same:

[//]: # (iscript one % menu -x)
~~~
% .score
Carts are identical
 
~~~

Let's see what happens if we remove the decaf from the cart and then score:

[//]: # (iscript one % menu -x)
~~~
% remove decaf

  2 iced tall mocha (803)                  304:1:1
    3 vanilla syrup (2502)                   609:2

% .score
Carts are different.
Total repairs: 1
  0:   id(11): insert default item(decaf)
 
~~~

Now let's change the quantity of the vanilla syrup:

[//]: # (iscript one % menu -x)
~~~
% remove vanilla syrup

  2 iced tall mocha (803)                  304:1:1

% add two vanilla syrup

  2 iced tall mocha (803)                  304:1:1
    2 vanilla syrup (2502)                   609:2

% .score
Carts are different.
Total repairs: 2
  0:   id(13): change item(vanilla syrup) quantity to 3
  1:   id(16): insert default item(decaf)
 
~~~

Now let's use the `.reset` command to remove everything from the cart and then add a muffin:

[//]: # (iscript one % menu -x)
~~~
% .reset
Cart has been reset.
 
% add apple bran muffin

  1 apple bran muffin (10000)                 2000

% .score
Carts are different.
Total repairs: 8
  0: id(17): delete item(apple bran muffin)
  1: id(18): insert default item(grande mocha)
  2: id(18): make item(grande mocha) quantity 2
  3: id(18): change item(grande mocha) attribute "hot" to "iced"
  4: id(18): change item(grande mocha) attribute "grande" to "tall"
  5:   id(19): insert default item(vanilla syrup)
  6:   id(19): make item(vanilla syrup) quantity 3
  7:   id(20): insert default item(decaf)
 
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

[//]: # (iscript one % menu -x)
~~~
% .newtest
Creating new yaml test.
Cart has been reset.
 
% .step hi um i'd like a tall flat white
 
~~~

Now we have to construct the cart for this step:

[//]: # (iscript one % menu -x)
~~~
% add tall flat white

  1 tall flat white (501)                  301:0:1

~~~

In the second step, we have to do a bit more work to update the cart:

[//]: # (iscript one % menu -x)
~~~
% .step actually can you make that iced and decaf
  1 tall flat white (501)                  301:0:1
 
% .reset
Cart has been reset.
 
% add iced tall flat white

  1 iced tall flat white (503)             301:1:1

% add decaf

  1 iced tall flat white (503)             301:1:1
    1 decaf (3000)                             704

~~~

Here's the third step:

[//]: # (iscript one % menu -x)
~~~
% .step and get me a warm bran muffin that's all
  1 iced tall flat white (503)             301:1:1
    1 decaf (3000)                             704
 
% add apple bran muffin

  1 iced tall flat white (503)             301:1:1
    1 decaf (3000)                             704
  1 apple bran muffin (10000)                 2000

% add warmed

  1 iced tall flat white (503)             301:1:1
    1 decaf (3000)                             704
  1 apple bran muffin (10000)                 2000
    1 warmed (200)                             100

~~~

Now let's add some suite tags and a comment and then generate the YAML:

[//]: # (iscript one % menu -x)
~~~
% .suites standard example
Suites set to "standard example"
 
% .comment a simple, three-step order
Comment set to "a simple, three-step order"
 
% .yaml

WARNING: test case expects short-order behavior.
Be sure to manually verify.

 
tests:
  - id: 0
    suites: standard example
    comment: 'a simple, three-step order'
    steps:
      - turns:
          - speaker: speaker
            transcription: hi um i'd like a tall flat white
        cart:
          items:
            - quantity: 1
              name: tall flat white
              sku: '501'
              children: []
      - turns:
          - speaker: speaker
            transcription: actually can you make that iced and decaf
        cart:
          items:
            - quantity: 1
              name: iced tall flat white
              sku: '503'
              children:
                - quantity: 1
                  name: decaf
                  sku: '3000'
                  children: []
      - turns:
          - speaker: speaker
            transcription: and get me a warm bran muffin that's all
        cart:
          items:
            - quantity: 1
              name: iced tall flat white
              sku: '503'
              children:
                - quantity: 1
                  name: decaf
                  sku: '3000'
                  children: []
            - quantity: 1
              name: apple bran muffin
              sku: '10000'
              children:
                - quantity: 1
                  name: warmed
                  sku: '200'
                  children: []

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
