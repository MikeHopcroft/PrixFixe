
* New
  * Unit tests for cartIsComplete()
  * itemInstanceFromLogialItem()
  * Remove idGenerator from unit test
  * Converter from legacy TestSuite to LogicalTestSuite
  * LogicalValidationSuite filter by suite, id, remove answers
  * LogicalValidationSuite grading/comparison/explanation function
  * Some provision for recording crashes/timeouts
  * YAML file schema
  * YAML files loader and validator
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
