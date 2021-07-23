# Prix-Fixe [![build](https://github.com/MikeHopcroft/PrixFixe/actions/workflows/ci.yaml/badge.svg)](https://github.com/MikeHopcroft/PrixFixe/actions/workflows/ci.yaml)

[![codecov](https://codecov.io/gh/MikeHopcroft/PrixFixe/branch/main/graph/badge.svg)](https://codecov.io/gh/MikeHopcroft/PrixFixe)


`prix-fixe` is an experimental package of tools and algorithms for constructing restaurant orders and evaluating natural language systems that generate orders. `prix-fixe` includes
* Tools for authoring menus
* An [interactive menu explorer](documentation/repl.md)
* An [API](documentation/api_overview.md) for constructing and manipulating orders
* A [repair cost metric](documentation/measures.md) for comparing orders
* [Tools](documentation/test_suite_tools.md) for testing natural language systems that generate orders
* A [sample menu](documentation/sample_menu.md) for testing purposes
* A [regression suite](samples/tests/regression.md) of example orders for evaluating natural language processing systems.

`prix-fixe` is currently in the earliest stages of development, so documentation is sparse, and the code stability is uneven. If you are interested in taking a look, we recommend starting with the
[Interactive Menu Explorer Tutorial](documentation/repl.md).

## Building Prix-Fixe

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

## Documentation, Tools and Samples

`prix-fixe` includes the following applications, samples, and tutorials:
* Menu
  * [Menu Concepts](documentation/menu_concepts.md) - DRAFT
  * [Menu File Format](documentation/menu_format.md) - COMING SOON
  * [Interactive Menu Explorer Tutorial](documentation/repl.md)
  * [Sample Restaurant Menu](documentation/sample_menu.md)
* CartOps
  * [API Overview](documentation/api_overview.md) - COMING SOON
  * CartOps
  * Catalog
  * AttributeInfo
  * RuleChecker
* Test Suite
  * [Testing Methodology](documentation/test_suite_tools.md)
  * [Measures](documentation/measures.md)
  * [Calculating Repair Cost](documentation/repair_cost.md)
  * [Test Suite File Format](documentation/test_suite_format.md) - DRAFT
  * [filter-suite.js tool](documentation/test_suite_tools.md#filter-suite-tool)
  * [evaluate.js tool](documentation/test_suite_tools.md#evaluate-tool)
  * [test-runner.js tool](documentation/test_runner_tool.md)
  * [expected.yaml](samples/tests/expected.yaml) - sample validation suite used in [Measures](documentation/measures.md).
  * [observed.yaml](samples/tests/observed.yaml) - ficticious output from a natural language processing system. Used in [Measures](documentation/measures.md).
  * [regression.md](samples/tests/regression.md) - description of regression suite
  * [regression.yaml](samples/tests/regression.yaml) - suite of cases covering a wide variety of ordering scenarios.
  * [Example orders](samples/tests/regression.md)
  
## Contributing
Interested in contributing? Read more [here](contributing.md).


