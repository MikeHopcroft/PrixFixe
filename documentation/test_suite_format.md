# Test Suite File Format

We use `prix-fixe` test suites to evaluate the performnce of natural language systems that process a conversation to produce pne or more shopping carts. Each conversation can be represented as a sequence of audio clips or text transcriptions. It can involve multiple speakers and any number of conversational turns. Expected shopping carts can be evaluated at the end of the conversation or after any turn. In this document, we describe the `TestSuite` components, the types of test suites, and the file format.

## Test Suite Components

[//]: # (warning)
Before diving in to the file format, it is helpful to understand the components 
that make up
a `TestSuite`. In the following, we use Typescript pseudocode to define the relevant data structures. The actual, formal type definitions can be found in 
[src/test_suite2/interfaces.ts](https://github.com/MikeHopcroft/PrixFixe/blob/mhop/authoring/src/test_suite2/interfaces.ts).

A `TestSuite` consists of a sequence of `TestCases`.

~~~
interface TestSuite {
    tests: TestCase[];
}
~~~

Each `TestCase` corresponds to a single customer ordering session and includes details about the conversation and information about the contents of the resulting shopping `Carts`. `TestCases` are made up of `TestSteps`, which correspond to portions of the conversation that produce interim `Carts` to be verified.

~~~
interface TestCase {
    id: number;
    suites: string;
    comment: string;
    steps: TestStep[];
}
~~~

The `TestCase` also includes
* **id** - a unique id number, which can be used to refer to a single test case. The `id` is mainly used by test runner tools to help investigate failing test cases.
* **suites** - a space-separated set of tags, which can be used to filter test suites and as a basis for aggregating scoring information. As an example, one might want to see scores aggregated by test case priority.
* **comment** - a note explaining the significance of the test case.

Each `TestStep` consists of a sequence of conversational turns, which provide information about what was said to produce a `LogicalCart.` Turns provide either text transcriptions or audio data (typically in the form of links to .WAV files).

~~~
interface TestStep {
    turns: TestTurn[];
    cart: LogicalCart;
}

interface TestTurn {
    speaker: string;
    audio?: string;         // Typically a URL to a .WAV file in the cloud.
    transcription?: string;
}
~~~

There is no hard and fast rule about how to group `Turns` into `Steps`. Each `Step` could contain a single `Turn`, or one `Step` could contain all of the `Turns` for the entire conversation. It all depends on points in the conversation where the `LogicalCart` should be verified.

The expected `LogicalCart` is just a sequence of `LogicalItem` trees. Each `LogicalItem` corresponds to a fully configured product with its options stored as children.

~~~
interface LogicalCart {
    items: LogicalItem[];
}

interface LogicalItem {
    quantity: number;
    name: string;
    sku: string;
    children: LogicalItem[];
}
~~~

## Test Suites, Validation Suites, and Scored Suites

`prix-fixe` makes use of three `TestSuite` variants:
* **TesteSuite** - this is a suite with all of the `cart` fields removed. It serves as input to a natural language processor that is under evaluation.
* **ValidationSuite** - this is a `TestSuite` that also includes the expected carts. It serves as both an answer key, and the format by which a natural language processor returns its results. `ValidationSuites` are sometimes used to provide training examples.
* **ScoredSuite** - this is a `ValidationSuite`, marked up with scoring information. The scoring information comes from comparing a `ValidationSuite` of expected carts with another containing carts produced by a natural language processor.

Scoring markup includes information about three measures:
* **perfect** - whether the expected and observed carts match perfectly
* **complete** - whether the expected and observed carts contain the same products in different arrangments
* **repair cost** - the sequence of steps required to convert the observed cart into the expected cart.

Please see [Measures](measures.md) and [Repair Cost](repair_cost) for more information on scoring.

## File Format

Let's look at a `ValidationSuite` for the following conversation, where we validate the cart after every turn:
* **Customer:** _Hi um i'd like a ah a latte with vanilla syrup._
* **Customer:** _Actually make that an iced decaf and add two muffins._
* **Customer:** _And can you warm those muffins?_

The suite is represented on disk as a YAML file:. Note that the transcriptions omit punctuation and most capitalization, and that the number two is spelled out. This was done to mimic the output of a speech-to-text system.
~~~
tests:
  - id: 0
    suites: 'example p1'
    comment: 'Example test, written to help explain the file format.'
    steps:
      - turns:
          - speaker: customer
            transcription: hi um i'd like a ah a latte with vanilla syrup
        cart:
          items:
            - quantity: 1
              name: grande latte
              sku: '602'
              children:
                - quantity: 1
                  name: vanilla syrup
                  sku: '2502'
                  children: []
      - turns:
          - speaker: customer
            transcription: actually make that an iced decaf and add two muffins
        cart:
          items:
            - quantity: 1
              name: iced grande latte
              sku: '604'
              children:
                - quantity: 1
                  name: vanilla syrup
                  sku: '2502'
                  children: []
                - quantity: 1
                  name: decaf
                  sku: '3000'
                  children: []
            - quantity: 2
              name: apple bran muffin
              sku: '10000'
              children: []
      - turns:
          - speaker: customer
            transcription: and can you warm those muffins
        cart:
          items:
            - quantity: 1
              name: iced grande latte
              sku: '604'
              children:
                - quantity: 1
                  name: vanilla syrup
                  sku: '2502'
                  children: []
                - quantity: 1
                  name: decaf
                  sku: '3000'
                  children: []
            - quantity: 2
              name: apple bran muffin
              sku: '10000'
              children:
                - quantity: 1
                  name: warmed
                  sku: '200'
                  children: []
~~~

If we weren't interested in the interim carts, we could organize around a single step with three turns. This would restrict verification to the final cart.
~~~
tests:
  - id: 0
    suites: 'example p1'
    comment: 'Example test, written to help explain the file format.'
    steps:
      - turns:
          - speaker: customer
            transcription: hi um i'd like a ah a latte with vanilla syrup
          - speaker: customer
            transcription: actually make that an iced decaf and add a muffin
          - speaker: customer
            transcription: and can you warm the muffin
        cart:
          items:
            - quantity: 1
              name: iced grande latte
              sku: '604'
              children:
                - quantity: 1
                  name: vanilla syrup
                  sku: '2502'
                  children: []
                - quantity: 1
                  name: decaf
                  sku: '3000'
                  children: []
            - quantity: 1
              name: apple bran muffin
              sku: '10000'
              children:
                - quantity: 1
                  name: warmed
                  sku: '200'
                  children: []
~~~


## Another Example

THIS IS WORK IN PROGRESS

* **Employee:** _Welcome to Mike's American Grill. What can I get started for you?_
* **Customer:** _I'll have a Petaluma chicken fried with extra pickles._
* **Employee:** _Is that the sandwich or the comba?_
* **Customer:** _The meal, please._
* **Employee:** _And that comes with fries or cole slow._
* **Customer:** _I'll have the fries._
* **Employee:** _And what would you like to drink with that?_
* **Customer:** _A root beer._
* **Employee:** _Great. Is that all?_
* **Customer:** _Yes. Thank you._
* **Employee:** _That'll be ten seventy five at the window._
 
