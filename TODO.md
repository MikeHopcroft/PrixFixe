
* New
  * Top
    * GenericCase and GenericNumberedCase - what are ids for?
    * x Generate JSON schema
    * Review: in convertSuite: STEP2 extends Step<TURN1> vs. STEP2 extends Step<TURN2>
  * x YAML file schema
  * REVIEW: GenericSuite should have tests field. Legacy converter returns array
  * REVIEW definition of AnySuite<TURN extends TurnBase & Partial<CombinedTurn>>
    * Does type contraint need Partial<>?
  * Mode that doesn't require World to be loaded
  * Rename YAMLValidationError to SchemaValidationError
  * YAML files loader and validator
  * LogicalValidationSuite filter
    * suite
    * id
    * x remove carts
    * x remove audio
    * x remove transcription
    * README.md instructions
  * LogicalValidationSuite grading/comparison/explanation function
  * ? itemInstanceFromLogialItem()
  * Remove idGenerator from unit test - why?
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

