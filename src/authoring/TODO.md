# TODO List

* Issue with falsey values (if (form || ...))
* .products and .options command for REPL
* x Understand importance of ENTITY vs OPTION
  * x Implement in builder, processGroups()
* Verify that defaultForm is one of the generated forms
* Larger menu
* Roadmap.yaml
* Consistent tab spacing.
* Update error formatting for new groupSpecType
* Where do pid gaps go?
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
* Modify REPL to generate new test suite format
  * New structure
  * SKU based, instead of Keys
