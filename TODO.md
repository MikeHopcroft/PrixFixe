
* New
  * Top
    * GenericCase and GenericNumberedCase - what are ids for?
    * Generate JSON schema
    * Review: in convertSuite: STEP2 extends Step<TURN1> vs STEP2 extends Step<TURN2>
  * YAML file schema
  * YAML files loader and validator
  * LogicalValidationSuite filter by suite, id, remove answers
  * LogicalValidationSuite grading/comparison/explanation function
  * itemInstanceFromLogialItem()
  * Remove idGenerator from unit test - why?
  * Converter from legacy TestSuite to LogicalTestSuite
    * x File names from command line
    * x Success or failure message
    * x Usage message
    * x Try/catch and report sensible errors.
    * Convert keys to skus
    * Commit converted roadmap file
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

