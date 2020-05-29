# Prix-Fixe [![Build Status](https://travis-ci.com/MikeHopcroft/PrixFixe.svg?branch=master)](https://travis-ci.com/MikeHopcroft/PrixFixe) [![Coverage Status](https://coveralls.io/repos/github/MikeHopcroft/PrixFixe/badge.svg?branch=master)](https://coveralls.io/github/MikeHopcroft/PrixFixe?branch=master)

`Prix-Fixe` is an experimental system for constructing and validating restaurant orders. `Prix-Fixe` includes
* Tools for authoring menus
* An interactive menu explorer tool
* An API for constructing and manipulating orders.
* A sample menu

## Try Prix-Fixe

`prix-fixe` is currently in the earliest stages of development, so documentation is sparse, and the code stability is uneven.

If you are interested in taking a look, you can clone the repo on GitHub or install [prix-fixe](https://www.npmjs.com/package/prix-fixe) with npm.

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

## Sample Applications and Data

`prix-fixe` includes the following samples:
* Menu
  * [Interactive Menu Explorer](documentation/repl.md)
  * [Sample Restaurant Menu](documentation/sample_menu.md)
* Test Suite
  * [Overview](documentation/test_suite_tools.md)
  * [filter-suite.js](documentation/test_suite_tools.md#filter-suite)
  * [evaluate.js](documentation/test_suite_tools.md#evaluate.md)

## Documentation

* [Menu Concepts](documentation/menu_concepts.md)
* [API Overview](documentation/api_overview.md)

## Contributing
Interested in contributing? Read more [here](contributing.md).


