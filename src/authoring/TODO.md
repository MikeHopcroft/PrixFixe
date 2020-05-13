# TODO List

* General purpose traverse, map, filter methods for carts and test suites.
  * Also consider async versions.
* test_runner2
  * Work on tree of tests, instead of flat list
  * Write results
  * Option to rebase tests
  * Better repair function messages
* Test measurements should be able to record crashes/exceptions
  * Update test_runner2.js to handle exceptions
* Ability to import catalog multiple times - to allow each catalog file to be stand-alone
* Get SKU, PID, TID, Key, AID, etc from correct location
* catalog.yaml
  * x "syrup" on end of syrup names
  * x caffe mocha aliases
* Decide about keys with no attributes. PID: or PID?
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
