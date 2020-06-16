# TODO List

* Top
  * travis build break - npm.cmd not found
  * regression.md
    * x Test case ids
    * x Regenerate
    * Documentation build script
  * README.md for fuzzer directory
  * Publish prix-fixe version
  * Short-order
    * Take prix-fixe version
    * Merge to master
* version
  * x merge prix-fixe master
  * publish prix-fixe version
  * merge shortorder master
  * short-order take new prixfixe
  * menu_concepts.md
    * Update
* Refactor and cleanup
  * npm audit and dependabot
  * General purpose traverse, map, filter methods for carts and test suites.
  * Also consider async versions.
  * Get SKU, PID, TID, Key, AID, etc from correct location
  * Fix comment "// Hack - really just want the new tensor/form/defaultForm application"
  * Get rid of genericEntityFactory() and specificEntityFactory()
  * TODO: remove indexing of units - products.ts, rules.ts
  * cleanup launch.json in all three projects
  * cleanup .vscode
  * . Figure out 2 vs 4 space tabs in VSCode
  * Consistent tab spacing.
  * Convert short-order's ProcessOneDemo to replace testCase.run() with code from test_suite2
  * Rationalize formatting.ts and markdown.ts
  * Deprecate old tools
  * console.log(' ') vs console.log('') vs console.log().
    * consider newline() function
  * Investigate keys for null tensor
  * attribute_info.ts
    * Consider rewrite, based on DimensionSpec
    * Remove Dimension class - just use DimensionDescription
    * Move DID to interfaces.ts
  * Issue with falsey values (if (form || ...))
* Singleton options, like the milks and the caffination levels
  * Fuzzer support as well.
* Regression test
  * Markdown version of regression suite
    * Should include test case id.
  * Removal cases: "i don't want foo", "i want no foo", "make that with no foo"
  * "make item quantity" => "change item quantity from x to y"
  * Test matrix generator for modify
    * make [that|target] [with] [attribute|option|product]
    * change [that|target] to [attribute|option|product]
    * add [attribute|option] [to [that|target]]
    * remove the [option] [from [that|product]]
    * make [that|target] [no|non|without] [opton]
    * replace [the|that] [option] with [option]
    * make the [option|attribute] [option|attribute]

* sort out whether prix-fixe and short-order have the correct menu files
  * x Why are bakery PIDs higher than coffee PIDs? Because of PID and SKU properties in context.
  * measures.md seems to have the wrong PIDs (e.g latte is 600)
* token-flow, prix-fixe, short-order ecosystem notes
* x Test runner compare with baseline feature
* x Test runner suppress details (show only summary)
* REPL
  * .products/.options/.menu command should mark hidden attributes
  * .products/.options/.menu should display sorted item lists
  * repl_main.ts
    * Convert to command-line-usage
  * short-order repl .tokenize command should print scores
  * x extra line after .aliases/.specifics/.exclusions/.reset
  * x empty cart in REPL uses lots of white space
  * x Consider printing SKUs in cart display
  * x Generate new test suite format
    * x New structure
    * x SKU based, instead of Keys
  * x .products and .options command for REPL
  * x Show exclusion sets in REPL

* tutorial_builder
  * clean up
  * x finish repair
  * test with real documentation
* test-runner.js
  * Test cases should be able to start with a non-empty cart
  * x Update to use testRunnerMain2()
  * Rename application - to what?
  * Test measurements should be able to record crashes/exceptions
    * Update test_runner2.js to handle exceptions
  * Test measurements should be able to record running time
    * Report n-9s latency and cases
  * combine aggregate.ts and pass_fail.ts, convert from print to format 
  * Fix: console.log(`repair algorithm: ${measures.notes}`); - measures.notes is '' in test_runner2.
  * Write results
    * x Text
    * Markdown
    * test_runner_main2.ts markdown output
  * Option to rebase tests
  * x factor out scoring code for use by file comparison tool
  * x Summarize pass/fail rates by suite
  * x Work on tree of tests, instead of flat list 
  * x Better repair function messages

* Documentation
  * Convert problem statement deck into markdown
  * Expanation of token-flow
  * better documentation for apps/authoring/test_suite2
  * Document aliases mini language
  * test_suite_tools.md
    * Explanatory text
    * x Workflow diagram
    * unix syntax
    * Use tutorial_builder
    * -a flag for evaluate
    * Build from documentation/src
  * repairs.md
    * x inkscape diagrams
    * x correct SKUs and names
    * Link from main page
  * measures.md
    * x correct SKUs and names
    * Link from main page
  * Document generator for repair cost!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
* Documentation for new tools
  * Make tutorial_builder available to short-order
  * Documentation build
    * Warning marker for text with PIDs that must be manually updated.
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
* x Verify expected vs observed parameter order in scoreSuite
* x test_runner_main2.ts and evaluate.ts should share evaluate function.
* x test_runner_main2.ts verbose mode and other command-line flags
* x Remove directory mode from test_runner_main2. Preserve suite hierarchy.
* x Markdown rendering should indicate pass/fail status if available
* x Bugs
  * x node build\samples\test_runner.js samples\menu\regression.yaml -s=!regression
  * x Reports incorrect number of failed cases
  * x May want to refactor PassFail to take suite string
* x Remove samples/menu/bugs.md - put these cases in regression.yaml
* x samples/menu/menu.yaml
* x Remove old samples
* figure out how to share prix-fixe apps
  * with short-order
  * without breaking web pages
* Authoring
  * It is confusing that exclusion sets can contain illegal children
  * Ability to import catalog multiple times - to allow each catalog file to be stand-alone
  * Cookbooks
  * x Verify that defaultForm is one of the generated forms
    * x Decode "Default form 0:3 not in set of generated forms"
  * x Decide about keys with no attributes. PID: or PID?
  * x Ability to merge catalogs
    * x Ability to detect PID and SKU conflicts
    * x Imports field in group?
    * x Merge *.yaml from directory?
    * Namespacing
    * x SKU and PID stability
  * Update error formatting for new groupSpecType
  * SKU stability across menu edits = to facilitate test suite stability
    * SKU stability via join with external file
    * x Test suite migration tool - perhaps using item name
    * Test suite rebasing
  * Tags
    * x Hierarchical
    * Include
    * Exclude
  * Per-SKU overrides for specifics
    * some solution for overriding generated specifics with hand-authored
    * e.g. to supply custom/non-generated SKU, custom/non-generated name
    * Demonstrate ability to combine authored menu with SKU list

* Menu
  * Remove option tensor from milks, sliced, warmed, to-go, etc.
  * Where do pid gaps go?
  * Add water as a product to the menu to show ambiguity with option.
    * e.g. "get me a latte with water" - two drinks or one with water added?
  * catalog.yaml
    * . Larger menu
    * Petaluma chicken sandwich
      * House special - to match documentation
      * Grilled or fried
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
* Roadmap.yaml
* x Understand importance of ENTITY vs OPTION
  * x Implement in builder, processGroups()
* x Better validation errors
  * x https://github.com/gcanti/io-ts/blob/master/Type.md#error-reporters
  * x https://www.npmjs.com/package/io-ts-reporters
