# TODO List

~~~
D:\git\menubot\PrixFixe>node build\src\apps\repair-suite.js ..\ShortOrder\samples\menu\regression.yaml c:\temp\regression.yaml -d=..\ShortOrder\samples\menu
CreateWorld2
Reading ..\ShortOrder\samples\menu\coffee.yaml
Loading D:\git\ShortOrder\samples\menu\coffee.yaml
Error: cannot open "D:\git\ShortOrder\samples\menu\coffee.yaml".

Combines paths wrong
~~~

* Documentation for new tools
* Deprecate old tools
* Merge into master
* Test matrix generator for modify
  * make [that|target] [with] [attribute|option|product]
  * change [that|target] to [attribute|option|product]
  * add [attribute|option] [to [that|target]]
  * remove the [option] [from [that|product]]
  * make [that|target] [no|non|without] [opton]
  * replace [the|that] [option] with [option]
  * make the [option|attribute] [option|attribute]
* x Bug
  * x node build\samples\test_runner.js samples\menu\regression.yaml -s=!regression
  * x Reports incorrect number of failed cases
  * x May want to refactor PassFail to take suite string
* better documentation for apps/authoring/test_suite2
* test_runner_main2
  * factor out scoring code for use by file comparison tool
  * combine aggregate.ts and pass_fail.ts, convert from print to format
  * x Summarize pass/fail rates by suite
  * Fix: console.log(`repair algorithm: ${measures.notes}`); - measures.notes is '' in test_runner2.
  * Work on tree of tests, instead of flat list
  * Write results
  * Option to rebase tests
  * Test measurements should be able to record crashes/exceptions
    * Update test_runner2.js to handle exceptions
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
