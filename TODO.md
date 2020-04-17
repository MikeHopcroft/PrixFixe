
* New
  * x GenericSuite should have tests field. Legacy converter returns array
  * Top
    * npm audit fixes
    * GenericCase and GenericNumberedCase - what are ids for?
    * x Generate JSON schema
    * Review: in convertSuite: STEP2 extends Step<TURN1> vs. STEP2 extends Step<TURN2>
  * x YAML file schema
  * REVIEW definition of AnySuite<TURN extends TurnBase & Partial<CombinedTurn>>
    * Does type contraint need Partial<>?
  * Rename YAMLValidationError to SchemaValidationError
  * YAMLValidationError should not print details - error handler should do this.
  * x YAML files loader and validator - add to filter-suite and legacy-converter
  * x Error formatting code
  * >>>>>> Evaluate
    * x Put aggregate measures into output suite.
    * Mode that doesn't require World to be loaded
    * Should not crash if suite references unknown SKU
    * Repair cost explanation function
    * Remove idGenerator from unit test - why?
    * x itemInstanceFromLogicalItem()
    * x LogicalValidationSuite grading/comparison
  * LogicalValidationSuite filter
    * x suite
    * x id - decided not to filter by number
    * x remove carts
    * x remove audio
    * x remove transcription
    * README.md instructions
  * Converter from legacy TestSuite to LogicalTestSuite
    * x File names from command line
    * x Success or failure message
    * x Usage message
    * x Try/catch and report sensible errors.
    * x Convert keys to skus
    * x Commit converted roadmap file
    * x Fixup name field.
    * README.md instructions
  * src/apps/README.md
  * Some provision for recording crashes/timeouts
  * x Unit tests for cartIsComplete()
* TestStep
  * Replace TestLineItem.key field with sku
  * Replace rawSTT, correctedSTT, and correctedScope with input
  * Script to update existing tests - perhaps modify test_converter.ts
* YamlTestSuite
  * Define this interface
* Schemas.ts
  * Export schema or make validator available
* TestCounts
  * Place adjacent to its one use
* Result
  * Remove toJUnitXml()?
  * Rename to TestResult?
* TestSuite
  * Inversion of control?
* Polymorphic test suite?
* Do we need ItemInstance.uid?
* Plan
  * key <==> sku conversion method
  * SKUCart and SKUItemInstance and SKUProcessor
  * SimpleCart, SimpleItem, SimpleProcessor

