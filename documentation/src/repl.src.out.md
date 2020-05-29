# Interactive Menu Explorer

The best way to see `prix-fixe` in action is through its interactive menu explorer.
The menu defines a set of `products`, `options`, and `attributes`, along with `rules` for combining these concepts into fully specified items. The menu explorer allows us to interactively browse and examine each of these elements.

The menu explorer also provides functionality for testing systems that generate shopping carts based on text or speech input. More on authoring and running test suites this later.

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
% npm run install
% npm run compile
~~~

## Running the Menu Explorer
Use the `node` command to start up the menu explorer. The sample menu will be loaded by default.


[//]: # (shell)
~~~
Using experimental createWorld2()
CreateWorld2
Reading ..\shortorder\samples\menu\coffee.yaml
Loading D:\git\menubot\shortorder\samples\menu\coffee.yaml
Reading bakery.yaml
Loading D:\git\menubot\shortorder\samples\menu\bakery.yaml
Loaded prix-fixe extension.
Loaded simple extension.
create processor
  Registering simple processor: Simple processor that leaves the State unchanged.
Current processor is Simple processor that leaves the State unchanged..

Welcome to the PrixFixe REPL.
Type your order below.
A blank line exits.

Type .help for information on commands.

% 
~~~

Now let's take a look at the menu. We can use the `.products` command to display the list of products in the menu:
[//]: # (shell)
~~~


% .products
cappuccino (1)
flat white (2)
latte (3)
latte macchiato (4)
mocha (5)
chai latte (6)
espresso (100)
lungo (101)
ristretto (102)
macchiato (103)
americano (200)
dark roast coffee (201)
apple bran muffin (2000)
blueberry muffin (2001)
lemon poppyseed muffin (2002)
 
% 
~~~
Each product name is followed by its product id or `PID`. You drilldown on the specifics of a product by including the `PID` in the `.products` command. Let's look at the `latte` whose `PID` is `3`:
[//]: # (shell)
~~~


% .products 3
latte (3)
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
    short latte (3:0:0, 200)
    tall latte (3:0:1, 201)
    grande latte (3:0:2, 202) <== default
    iced tall latte (3:1:1, 203)
    iced grande latte (3:1:2, 204)
    iced venti latte (3:1:3, 205)
  Options for grande latte:
    almond milk (506)
    almond syrup (300)
    buttered rum syrup (301)
    caramel syrup (302)
    cinnamon (700)
    cinnamon syrup (303)
    coconut milk (504)
    decaf (404)
    dry (804)
    eggnog (508)
    equal (900)
    foam (701)
    for here cup (800)
    half caf (402)
    hazelnut syrup (304)
    honey (901)
    ice (702)
    lid (801)
    nonfat milk (503)
    nutmeg (703)
    oat milk (507)
    one percent milk (502)
    one third caf (403)
    orange syrup (305)
    peppermint syrup (306)
    raspberry syrup (307)
    regular (400)
    soy milk (505)
    splenda (902)
    sugar (903)
    sugar in the raw (904)
    sweet n low (905)
    to go (803)
    toffee syrup (308)
    two percent milk (501)
    two thirds caf (401)
    vanilla syrup (309)
    water (705)
    wet (805)
    whipped cream (704)
    whole milk (500)
    with room (802)
  Exclusion Set 0
    whole milk (500)
    two percent milk (501)
    one percent milk (502)
    nonfat milk (503)
    coconut milk (504)
    soy milk (505)
    almond milk (506)
    oat milk (507)
    eggnog (508)
  Exclusion Set 1
    regular (400)
    two thirds caf (401)
    half caf (402)
    one third caf (403)
    decaf (404)
  Exclusion Set 2
    for here cup (800)
    to go (803)
  Exclusion Set 3
    dry (804)
    wet (805)
% 
~~~

This command returned a huge amount of information. Let's go through it section-by-section:
* **Aliases** - this is a list of word tuples that represent ways of saying the name of the product. Note that aliases cannot always be inferred from the product's formal name. Sometimes products have alterntive names that don't have any apparent relationship to formt name. An example would be a `"House Special"`, which might be the same as a `"Petaluma Chicken Sandwich"`.
* **Attributes** - This is the set of attributes whose values specify the `SKU` of the fully configured product. Attributes are organized into dimensions, and each attribute specifies a number of aliases. This example shows six attributes, organized into two dimensions (`coffee_temperature` and `coffee_size`).
* **Specifics** - This is the list of fully configured versions of the product. Note that not all combinations of attributes are legal. In this example, the `short iced` and `venti hot` forms are not legal. Note that one of the specific forms is the default form that is implied when no attributes are specified. Each specific form is followed by its `KEY` and then its `SKU`. The `KEY` combines the `PID` with coordinates into the attribute tensor. For example, the `"short latte"` has `KEY=3:0:0`, implying `PID=3` and `hot` and `short`. Its `SKU` is `200`.
* **Options** - This is the list of options that are legal for the product. We can examine any of the options with the `.options` command.
* **Exclusion Sets** - Some options are mutually exclusive. In this case, a latte can only specify one type of milk, one caffeine level. It can be for here or to go and it can be wet or dry.

Now let's use the `.options` command to drill down on the `foam` option. It's `PID` is `701`:
[//]: # (shell)
~~~


% .options 701
foam (701)
  Aliases:
    foam
  Attributes:
    option_quantity
      no (0)
        no
        none
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
        additional
        extra
        heavy
        heavy on the
        lots of
        more
  Specifics:
    no foam (701:0, 4800)
    light foam (701:1, 4801)
    foam (701:2, 4802) <== default
    extra foam (701:3, 4803)
  Options for foam:
% 
~~~
We can see that the `foam` option is a bit simpler than the `latte` product, but it still has an attribute to specify the amount.

Note that we can also use the `.aliases`, `.exclusions`, and `.specifics` commands if we only want to see a slice of information about a product or an option:
[//]: # (shell)
~~~


% .aliases 3
latte (3)
  Aliases:
    caffe latte
    latte
% .specifics 701
  Specifics:
    no foam (701:0, 4800)
    light foam (701:1, 4801)
    foam (701:2, 4802) <== default
    extra foam (701:3, 4803)
% .exclusions 201
  Exclusion Set 0
    whole milk (500)
    two percent milk (501)
    one percent milk (502)
    nonfat milk (503)
    coconut milk (504)
    soy milk (505)
    almond milk (506)
    oat milk (507)
    eggnog (508)
  Exclusion Set 1
    regular (400)
    two thirds caf (401)
    half caf (402)
    one third caf (403)
    decaf (404)
  Exclusion Set 2
    for here cup (800)
    to go (803)
  Exclusion Set 3
    dry (804)
    wet (805)
~~~

## Building Orders
The `Menu Explorer` comes with a rudamentory text processor that can be used to put together orders, which serve as a building block for test suites. The text processor supports the following syntax for adding a product to the order or adding an option to the most recently added product:
~~~
add [one|two|three] <specific product name>
~~~

Here are some examples:
[//]: # (shell)
~~~


% add two iced grande latte

  2 iced grande latte (204)                  3:1:2



% add light foam

  2 iced grande latte (204)                  3:1:2
    1 light foam (4801)                      701:1



% add apple bran muffin

  2 iced grande latte (204)                  3:1:2
    1 light foam (4801)                      701:1
  1 apple bran muffin (10000)                 2000
~~~

The text processor supports the following syntax to remove a product or option:
~~~
remove <specific product name>
~~~

Here are some examples:
[//]: # (shell)
~~~


% remove light foam

  2 iced grande latte (204)                  3:1:2
  1 apple bran muffin (10000)                 2000



% remove iced grande latte

  1 apple bran muffin (10000)                 2000



% remove apple bran muffin





% 
~~~

## Measuring Repair Cost
The `Menu Explorer` can calculate the repair cost to convert an observed cart into an expected cart. To use this feature, you must first construct an expected cart:
[//]: # (shell)
~~~


% add two iced tall mocha

  2 iced tall mocha (403)                    5:1:1



% add decaf

  2 iced tall mocha (403)                    5:1:1
    1 decaf (2600)                             404



% add three vanilla syrup

  2 iced tall mocha (403)                    5:1:1
    1 decaf (2600)                             404
    3 vanilla syrup (2102)                   309:2



% .expect
Expected cart set
~~~

The `.score` command compares the current cart with the expected cart. Right now the carts are the same:
[//]: # (shell)
~~~


% .score
Carts are identical
 
~~~

Let's see what happens if we delete vanilla syrup from the cart and then score:
[//]: # (shell)
~~~


% remove decaf

  2 iced tall mocha (403)                    5:1:1
    3 vanilla syrup (2102)                   309:2



% .score
Carts are different.
Total repairs: 1
  0:   id(11): insert default item(decaf)
 
~~~

Now let's change the quantity of the vanilla syrup:
[//]: # (shell)
~~~


% remove vanilla syrup

  2 iced tall mocha (403)                    5:1:1



% add two vanilla syrup

  2 iced tall mocha (403)                    5:1:1
    2 vanilla syrup (2102)                   309:2



% .score
Carts are different.
Total repairs: 2
  0:   id(13): change item(vanilla syrup) quantity to 3
  1:   id(16): insert default item(decaf)
 
~~~

Now let's use the `.reset` command to remove everything from the cart and then add a muffin:
[//]: # (shell)
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
The `Menu Explorer` includes commands for authoring test suites that can be used to evaluate `text-to-order` systems. The process involves the following steps:
* Use the `.newtest` command to start a test.
* For each step in the conversation
  * Use the `.step` command to record the text input.
  * Use the `add` and `remove` syntax, along with the `.reset` and `.undo` commands to construct the expected cart.
* Optionally use the `.suites` command to tag the test with suite names.
* Optionally use the `.comment` command to add a text comment to the test.
* Use the `.yaml` command to print out the YAML representation of the test.

Let's create the test for the following three-step order:
* _"hi um i'd ah like a tall flat white"_
* _"actually can you make that iced"_
* _"and get me a warm bran muffin that's all"_

We start the test with the `.newtest` command and then use `.step` to record the text.
[//]: # (shell)
~~~


% .newtest
Creating new yaml test.
Cart has been reset.
% .step hi um i'd like a tall iced flat white
~~~

Now we have to construct the cart for this step:
[//]: # (shell)
~~~


% add tall flat white

  1 tall flat white (101)                    2:0:1
~~~

In the second step, we have to do a bit more work to update the cart:
[//]: # (shell)
~~~


% .step actually can you make that iced
  1 tall flat white (101)                    2:0:1


% .reset
Cart has been reset.
% add iced tall flat white

  1 iced tall flat white (103)               2:1:1
~~~

Here's the third step:
[//]: # (shell)
~~~


% .step and get me a warm bran muffin that's all
  1 iced tall flat white (103)               2:1:1


% add apple bran muffin

  1 iced tall flat white (103)               2:1:1
  1 apple bran muffin (10000)                 2000



% add warmed

  1 iced tall flat white (103)               2:1:1
  1 apple bran muffin (10000)                 2000
    1 warmed (6700)                           1200
~~~

Now let's add some suite tags and a comment and then generate the YAML:
[//]: # (shell)
~~~


% .suites standard example
Suites set to "standard example"
% .comment a simple, three-step order
Comment set to "a simple, three-step order"
% .yaml
%  

WARNING: test case expects short-order behavior.
Be sure to manually verify.

 
tests:
  - id: 0
    suites: standard example
    comment: 'a simple, three-step order'
    steps:
      - turns:
          - speaker: speaker
            transcription: hi um i'd like a tall iced flat white
        cart:
          items:
            - quantity: 1
              name: tall flat white
              sku: '101'
              children: []
      - turns:
          - speaker: speaker
            transcription: actually can you make that iced
        cart:
          items:
            - quantity: 1
              name: iced tall flat white
              sku: '103'
              children: []
      - turns:
          - speaker: speaker
            transcription: and get me a warm bran muffin that's all
        cart:
          items:
            - quantity: 1
              name: iced tall flat white
              sku: '103'
              children: []
            - quantity: 1
              name: apple bran muffin
              sku: '10000'
              children:
                - quantity: 1
                  name: warmed
                  sku: '6700'
                  children: []
~~~


## Extending the Menu Explorer

We can provide the `Menu Explorer` with a `processor` that performs operations on a shopping cart, in response to a text input line.


