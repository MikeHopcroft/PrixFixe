# Test Suite Tools

## Methodology

* Test Suite
* Validation Suite
* Scored Suite

Add a diagram of the workflow.

## Filter Suite Tool


~~~
$ node build/src/apps/filter-suite.js -h

Test suite filter

  This utility filters carts, transcriptions, audio, and entire test cases from
  a supplied test suite.

Usage

  node filter-suite.js <input file> <output file> [...options]

Options

  -a, --a               Remove the audio field from each turn.
  -c, --c               Remove the cart field from each step.
  -t, --t               Remove the transcription field from each turn.
  -s, --s suiteFilter   Boolean expression of suites to retain.Can use suite
                        names, !, &, |, and parentheses.
  -h, --help            Print help message
~~~

~~~
$ node build/src/apps/filter-suite.js samples\tests\expected.yaml c:\temp\test.yaml -c
Reading suite from samples\tests\expected.yaml
Removing cart field from each Step.
Writing filtered suite to c:\temp\test.yaml
Filtering complete
~~~


## Evaluate Tool

~~~
$ node build/src/apps/evaluate.js samples/tests/expected.yaml samples/tests/observed.yaml -x -v
Comparing
  expected validation suite: samples/tests/expected.yaml
  observed validation suite: samples/tests/observed.yaml

Computing repair cost with menu files from samples/menu.

createWorld2()
CreateWorld2
Reading samples\menu\coffee.yaml
Loading D:\git\menubot\PrixFixe\samples\menu\coffee.yaml
Reading bakery.yaml
Loading D:\git\menubot\PrixFixe\samples\menu\bakery.yaml
---------------------------------------
2: Product SKU is wrong because generic product is wrong.
  step 0: NEEDS REPAIRS
    employee: ok i've added a tall latte no foam with two pumps of vanilla and an apple bran muffin warmed

      1 tall mocha (401)                           401
        1 no foam (4800)                          4800
        2 vanilla syrup (2102)                    2102
      1 apple bran muffin (10000)                10000
        1 warmed (6700)                           6700

    id(23): delete item(tall mocha)
    id(28): insert default item(grande latte)
    id(28): change item(grande latte) attribute "grande" to "tall"
      id(29): insert default item(vanilla syrup)
      id(29): make item(vanilla syrup) quantity 2
      id(30): insert default item(foam)
      id(30): change item(foam) attribute "regular" to "no"

---------------------------------------
3: Product SKU is wrong because one or more attributes are wrong.
  step 0: NEEDS REPAIRS
    employee: ok i've added a tall latte no foam with two pumps of vanilla and an apple bran muffin warmed

      1 iced venti latte (205)                     205
        1 no foam (4800)                          4800
        2 vanilla syrup (2102)                    2102
      1 apple bran muffin (10000)                10000
        1 warmed (6700)                           6700

    id(33): change item(iced venti latte) attribute "iced" to "hot"
    id(33): change item(iced venti latte) attribute "venti" to "tall"

---------------------------------------
4: Product quantity is wrong
  step 0: NEEDS REPAIRS
    employee: ok i've added a tall latte no foam with two pumps of vanilla and an apple bran muffin warmed

      5 tall latte (201)                           201
        1 no foam (4800)                          4800
        2 vanilla syrup (2102)                    2102
      1 apple bran muffin (10000)                10000
        1 warmed (6700)                           6700

    id(43): change item(tall latte) quantity to 1

---------------------------------------
6: Option SKU wrong because generic option is wrong.
  step 0: NEEDS REPAIRS
    employee: ok i've added a tall latte no foam with two pumps of vanilla and an apple bran muffin warmed

      1 tall latte (201)                           201
        1 no foam (4800)                          4800
        2 cinnamon syrup (1502)                   1502
      1 apple bran muffin (10000)                10000
        1 warmed (6700)                           6700

      id(64): delete item(cinnamon syrup)
      id(69): insert default item(vanilla syrup)
      id(69): make item(vanilla syrup) quantity 2

---------------------------------------
7: Option SKU wrong because one or more attributes are wrong.
  step 0: NEEDS REPAIRS
    employee: ok i've added a tall latte no foam with two pumps of vanilla and an apple bran muffin warmed

      1 tall latte (201)                           201
        1 extra foam (4803)                       4803
        2 vanilla syrup (2102)                    2102
      1 apple bran muffin (10000)                10000
        1 warmed (6700)                           6700

      id(75): change item(extra foam) attribute "extra" to "no"

---------------------------------------
8: Option quantity wrong.
  step 0: NEEDS REPAIRS
    employee: ok i've added a tall latte no foam with two pumps of vanilla and an apple bran muffin warmed

      1 tall latte (201)                           201
        1 no foam (4800)                          4800
        5 vanilla syrup (2102)                    2102
      1 apple bran muffin (10000)                10000
        1 warmed (6700)                           6700

      id(84): change item(vanilla syrup) quantity to 2

---------------------------------------
Repair algorithm: Menu-based repairs, createWorld2
Total test cases: 9
Total steps: 9
Perfect carts: 1/9 (11.1%)
Complete carts: 3/9 (33.3%)
Repaired carts: 6/9 (66.7%)
Total repairs: 15
Repairs/Step: 1.67

Case pass rate by suite:
  sample: 3/9

  Total failed cases: 6
  Overall pass rate: 3/9 (0.333)
---------------------------------------


Scoring complete
~~~


