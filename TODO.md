
* Newer
  * x Reinstate nameToSKU functionality from TutorialBuilder
    * x Removed in commit 1bd3f73753bb97165206d438d134821481969846
    * x Impacts documentation/src/measures.src.md repair functionality
    * Px robably need some notion of prepress extensions
    * x Need to wire in to npm build docs
  * x Install script commands for sample apps + update docs
  * Rename simple extension to add-remove extension
  * Test runner should set exit code
  * draw.io diagrams for repair_cost.src.md.
  * replCore2, useCreateWorld2
  * Default for: Use -d flag or PRIX_FIXE_DATA environment
  * Console spew
    * createWorld2()
    * CreateWorld2
    * Reading samples\menu\coffee.yaml
    * Loading 
  * Remove
    * toJUnitXml()
    * snacks.yaml
  * Remove obsolete apps
    test_converters.ts
    repair-suite.ts
  * What are the two files ending in .ts.save?
  * Remove old test suite
  * Review uses of process.exit()
  * Move away from `import *` syntax
  * Take recursive aliases PR.
  * Remove old rules engine.
  * Set up code coverage
  * Move CI from Travis to GitHub actions
  * What is the difference between samples folder and src/apps folder?
  * x Use prepress instead of TutorialBuilder
* New
  * . Repair algorithm should repair to complete, not perfect
    * Attempted implemention in commit 3cfc4ab3
    * Doesn't work because canonicalization won't necessarily put related items in close proximity.
    * Really want an algorithm based on a bipartite matching
  * x Repair algorithm should favor delete/insert over insert/delete
  * Simple repair cost field
  * Sample expected and observed files
  * Explain repair cost for specific id
    * Better item description
    * Better change description (e.g. map attribute names)
  * ScoredValidationSuite should record the repairFunction used.
  * Consider converting SuiteScorer class to function
  * Better name for TreeRepairs2 (and TreeRepairs)
  * Terminal color should be reset after errors. Repro with YAML syntax error, like "sku: 4" instead of "sku: '4'"
  * Refactor repair code
    * x DiffResults should be parameterized by one type not two
    * TreeRepairs class should just be an IRepairs.
      * Rename to POSRepairs
      * Remove repairCart() method
    * Make TreeRepairs.repairCart() into standalone function that takes an IRepairs, along with two carts to compare
    * Create EditDistanceRepairs class
    * Plumb menu code option through application
    * SuiteScorer takes an IRepairs and a cartFromLogicalCart() method - this can be wrapped into the repairs method.
    * Code should not crash for SKUs not in the menu
  * REVIEW: in convertSuite: STEP2 extends Step<TURN1> vs. STEP2 extends Step<TURN2>
  * REVIEW definition of AnySuite<TURN extends TurnBase & Partial<CombinedTurn>>
    * Does type contraint need Partial<>?
  * Rename YAMLValidationError to SchemaValidationError
  * YAMLValidationError should not print details - error handler should do this.
  * x GenericSuite should have tests field. Legacy converter returns array
  * Top
    * npm audit fixes
    * GenericCase and GenericNumberedCase - what are ids for?
    * x Generate JSON schema
  * x YAML file schema
  * x YAML files loader and validator - add to filter-suite and legacy-converter
  * x Error formatting code
  * >>>>>> Evaluate
    * x Put aggregate measures into output suite.
    * Mode that doesn't require World to be loaded
      * cartFromlogicalCart() and itemInstanceFromLogicalItem() take getKeyFromSKU() function.
      * TreeRepairs should not be an IRepairs - just need repairCart() function
      * scoreSuite() should be parameterized by scoreOneStep().
        * One version uses catalog and attributeInfo and gives repairs
        * >>>>>> Other version uses new cartIsPerfect() function
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

