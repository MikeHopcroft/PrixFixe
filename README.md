# Prix-Fixe [![Build Status](https://travis-ci.com/MikeHopcroft/PrixFixe.svg?branch=master)](https://travis-ci.com/MikeHopcroft/PrixFixe) [![Coverage Status](https://coveralls.io/repos/github/MikeHopcroft/PrixFixe/badge.svg?branch=master)](https://coveralls.io/github/MikeHopcroft/PrixFixe?branch=master)

`prix-fixe` is an experimental package of tools and algorithms for constructing restaurant orders and evaluating natural language systems that generate orders. `prix-fixe` includes
* Tools for authoring menus
* An interactive menu explorer
* An API for constructing and manipulating orders
* A repair cost metric for comparing orders
* Tools for testing natural language systems that generate orders
* A sample menu

`prix-fixe` is currently in the earliest stages of development, so documentation is sparse, and the code stability is uneven. If you are interested in taking a look, we recommend starting with the
[Interactive Menu Explorer Tutorial]((documentation/repl.md)).

## Building Prix-Fixe

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

## Documentation, Tools and Samples

`prix-fixe` includes the following applications, samples, and tutorials:
* Menu
  * [Menu Concepts](documentation/menu_concepts.md)
  * [Menu File Format](documentation/menu_format.md)
  * [Interactive Menu Explorer Tutorial](documentation/repl.md)
  * [Sample Restaurant Menu](documentation/sample_menu.md)
* CartOps
  * [API Overview](documentation/api_overview.md)
* Test Suite
  * [Testing Methodology](documentation/test_suite_tools.md)
  * [Calculating Repair Cost](documentation/repair_cost.md)
  * [Test Suite File Format](documentation/test_suite_format.md)
  * [filter-suite.js tool](documentation/test_suite_tools.md#filter-suite)
  * [evaluate.js tool](documentation/test_suite_tools.md#evaluate.md)
  * [expected.yaml](samples/tests/expected.yaml) - sample test suite
  * [observed.yaml](samples/tests/observed.yaml) - ficticious output from a natural language processing system.
  * [regression.yaml](samples/tests/regression.yaml) - suite of cases covering a wide variety of ordering scenarios.

## Contributing
Interested in contributing? Read more [here](contributing.md).


