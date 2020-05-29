# Interactive Menu Explorer

The best way to see `prix-fixe` in action is through its interactive menu explorer.
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
Use the `node` command to start up the menu explorer:


[//]: # (shell)
~~~
Using experimental createWorld2()
CreateWorld2
Reading ..\shortorder\samples\menu\coffee.yaml
Loading D:\git\menubot\shortorder\samples\menu\coffee.yaml
Reading bakery.yaml
Loading D:\git\menubot\shortorder\samples\menu\bakery.yaml
Loaded prix-fixe extension.
Loaded short-order extension.
  Registering so processor: short-order
Current processor is short-order.

Welcome to the PrixFixe REPL.
Type your order below.
A blank line exits.

Type .help for information on commands.

% 
~~~

At this point you can start entering utterances into the REPL:
[//]: # (shell)
~~~

% .help
.break        Sometimes you get stuck, this gets you out
.cart         Display shopping cart.
.clear        Break, and also clear the local context
.comment      Set the comment for the current yaml test
.debug        Toggle debug mode.
.exclusions   Display exclusion sets for a generic
.exit         Exit the repl
.expect       Set the expected cart for use by the .score command.
.graph        Display graph for text that follows
.help         Print this help message
.list         Display the steps in the current test
.load         Load JS from a file into the REPL session
.match        List fuzzy matches in order of decreasing score.
.menu         Display menu
.newtest      Start authoring a new yaml test
.options      Display options
.pop          Pop shopping cart from the stack.
.prefix       Sets the prefix for subsequent token-flow .query command
.processor    Switch processors
.products     Display top-level products
.push         Push shopping cart on the stack.
.query        Uses token-flow to score match against prefix.
.redo         Redo utterance after undo
.reset        Clear shopping cart.
.restore      Restore cart to top of stack without popping.
.save         Save all evaluated commands in this REPL session to a file
.score        Score current cart against expected cart.
.speaker      Set the speaker for the current yaml test
.specifics    Display list of legal specifics for a generic
.stem         Stem, but don't parse, text that follows
.step         Add a new step to a yaml test
.suites       Set the suites field for the current yaml test
.targets      Display targets for text that follows
.tokenize     Tokenize, but don't parse, text that follows.
.try          Try out an utterance without changing the cart.
.undo         Undo last utterance
.yaml         Print the yaml for the current test

Press ^C to abort current expression, ^D to exit the repl
% 
~~~

Products
[//]: # (shell)
~~~

% .products
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