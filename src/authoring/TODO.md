# TODO List

* TODO: remove indexing of units - products.ts, rules.ts
* Singleton options, like the milks and the caffination levels
  * Fuzzer support as well.
* Add water as a product to the menu to show ambiguity with option.
  e.g. "get me a latte with water" - two drinks or one with water added?
* cleanup launch.json in all three projects
* Remove cases "i don't want foo", "i want no foo", "make that with no foo"
* sort out whether prix-fixe and short-order have the correct menu files
  * Why are bakery PIDs higher than coffee PIDs?
  * measures.md seems to have the wrong PIDs (e.g latte is 600)
* token-flow, prix-fixe, short-order ecosystem notes
* Markdown version of regression suite
* . Figure out 2 vs 4 space tabs in VSCode
* Test runner compare with baseline feature
* Test runner suppress details (show only summary)
* Convert ProcessOneDemo to replace testCase.run() with code from test_suite2
* Document aliases mini language
* .products/.options/.menu command should mark hidden attributes
* extra line after .aliases/.specifics/.exclusions/.reset
* empty cart in REPL uses lots of white space
* "make item quantity" => "change item quantity from x to y"
* tutorial_builder
  * clean up
  * x finish repair
  * test with real documentation
* repl_main.ts
  * Convert to command-line-usage
* test-runner.js
  * Update to use testRunnerMain2()
  * Rename application
* test_suite_tools.md
  * Explanatory text
  * x Workflow diagram
  * unix syntax
  * Use tutorial_builder
  * -a flag for evaluate
  * Build from documentation/src
* cleanup .vscode
* version
  * x merge prixfix master
  * publish version
  * merge shortorder master
  * take new prixfixe
  * menu_concepts.md
    * Update
* repairs.md
  * x inkscape diagrams
  * x correct SKUs and names
  * Link from main page
* measures.md
  * x correct SKUs and names
  * Link from main page
* Document generator for repair cost!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
* x Remove samples/menu/bugs.md - put these cases in regression.yaml
* x samples/menu/menu.yaml
* x Remove old samples
* Get rid of genericEntityFactory() and specificEntityFactory()
* Documentation for new tools
  * Make tutorial_builder available to short-order
  * Documentation build
    * Ability to record any program - not just repl!!!!!!!!!!!!!!!!!!!!!!!!
      * x Pull executable name and parameters from markdown.
      * Pass regular expression for prompt? How will process() work?
    * x REPL
    * Analysis of repair cost metrics
    * Integrate documentation generation with build
    * Readline based repl
    * . General template based system?
  * short-order
    * README.md
    * repl
    * test_runner
    * confusion_matrix
    * stemmer_confusion
  * prix-fixe
    * README.md
    * samples
    * evaluate
    * filter_suite
    * markdown
    * menu_filter
    * test_runner2
* Rationalize formatting.ts and markdown.ts
* test_runner_main2.ts markdown output
* Test measurements should be able to record crashes/exceptions
  * Update test_runner2.js to handle exceptions
* Merge into master
* Deprecate old tools
* x Verify expected vs observed parameter order in scoreSuite
* x test_runner_main2.ts and evaluate.ts should share evaluate function.
* x test_runner_main2.ts verbose mode and other command-line flags
* x Remove directory mode from test_runner_main2. Preserve suite hierarchy.
* x Markdown rendering should indicate pass/fail status if available
* Test matrix generator for modify
  * make [that|target] [with] [attribute|option|product]
  * change [that|target] to [attribute|option|product]
  * add [attribute|option] [to [that|target]]
  * remove the [option] [from [that|product]]
  * make [that|target] [no|non|without] [opton]
  * replace [the|that] [option] with [option]
  * make the [option|attribute] [option|attribute]
* x Bugs
  * x node build\samples\test_runner.js samples\menu\regression.yaml -s=!regression
  * x Reports incorrect number of failed cases
  * x May want to refactor PassFail to take suite string
* better documentation for apps/authoring/test_suite2
* test_runner_main2
  * x factor out scoring code for use by file comparison tool
  * combine aggregate.ts and pass_fail.ts, convert from print to format 
  * x Summarize pass/fail rates by suite
  * Fix: console.log(`repair algorithm: ${measures.notes}`); - measures.notes is '' in test_runner2.
  * x Work on tree of tests, instead of flat list 
  * Write results
    * x Text
    * Markdown
  * Option to rebase tests
  * x Better repair function messages
* short-order repl .tokenize command should print scores
* figure out how to share prix-fixe apps
  * with short-order
  * without breaking web pages
* console.log(' ') vs console.log('') vs console.log().
* attribute_info.ts
  * Consider rewrite, based on DimensionSpec
  * Remove Dimension class - just use DimensionDescription
  * Move DID to interfaces.ts
* Test cases should be able to start with a non-empty cart
* Cookbooks
* General purpose traverse, map, filter methods for carts and test suites.
  * Also consider async versions.
* Ability to import catalog multiple times - to allow each catalog file to be stand-alone
* Get SKU, PID, TID, Key, AID, etc from correct location
* catalog.yaml
  * x "syrup" on end of syrup names
  * x caffe mocha aliases
  * chai [tea] latte - alias change
  * iced tea
  * chamomile tea / tea latte
  * earl gray tea
  * rooibos tea
  * peppermint tea
  * green tea
  * hot cocoa
  * steamer
  * tea latte
  * chai syrup
* x Decide about keys with no attributes. PID: or PID?
* x Ability to merge catalogs
  * x Ability to detect PID and SKU conflicts
  * x Imports field in group?
  * x Merge *.yaml from directory?
  * Namespacing
  * x SKU and PID stability
* It is confusing that exclusion sets can contain illegal children
* x Verify that defaultForm is one of the generated forms
  * x Decode "Default form 0:3 not in set of generated forms"
* . Larger menu
* Fix comment "// Hack - really just want the new tensor/form/defaultForm application"
* Roadmap.yaml
* Consistent tab spacing.
* Update error formatting for new groupSpecType
* Where do pid gaps go?
* Issue with falsey values (if (form || ...))
* REPL
  * x Consider printing SKUs in cart display
  * x Generate new test suite format
    * x New structure
    * x SKU based, instead of Keys
  * x .products and .options command for REPL
  * x Show exclusion sets in REPL
* x Understand importance of ENTITY vs OPTION
  * x Implement in builder, processGroups()
* Investigate keys for null tensor
* x Better validation errors
  * x https://github.com/gcanti/io-ts/blob/master/Type.md#error-reporters
  * x https://www.npmjs.com/package/io-ts-reporters
* SKU stability across menu edits = to facilitate test suite stability
  * SKU stability via join with external file
  * Test suite migration tool - perhaps using item name
  * Test suite rebasing
* Tags
  * x Hierarchical
  * Include
  * Exclude
* Per-SKU overrides for specifics
  * some solution for overriding generated specifics with hand-authored
  * e.g. to supply custom/non-generated SKU, custom/non-generated name
