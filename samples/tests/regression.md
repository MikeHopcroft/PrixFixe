# Example Orders
This file catalogs examples of menu ordering scenarios working in
[short-order](https://github.com/MikeHopcroft/ShortOrder).
In order to better illustrate the `add`, `remove`, and `modify`
scenarios, the transcripts below use a simplified grammar.
As an example, many of the add scenarios start with
"i'd like" and end with "that's it". 
Please be aware that the system accepts a much broader variety of
prologues, epilogues, disfluencies, and forms of speech.
Please see the specification for more details on the nature of
utterances likely to be accepted.

Note also that the system is designed to ignore portions of the
conversation that don't directly correspond to transactions on the
shopping cart, even if these passages contain product names.
The examples below do not illustrate the `ignore` scenario because
of the large number of cases.

We encourage you to try these examples in the short-order REPL yourself.
You can also run these examples as part of the regression suite.

The cases in this file are available in the
[regression.yaml](regression.yaml) suite.

## Adding Items

### Generic Items
Adding one single-term product

~~~
speaker: i'd like a latte that's it

  1 grande latte (602)                         602
~~~
Adding one multi-term product, exact match
~~~
speaker: i'll have a dark roast coffee thank you

  1 grande dark roast coffee (1502)           1502
~~~
Adding one multi-term product, partial match
~~~
speaker: get me a coffee please

  1 grande dark roast coffee (1502)           1502
~~~
Adding two instances
~~~
speaker: could i please get two mochas that's all

  2 grande mocha (802)                         802
~~~
Adding 25 instances
~~~
speaker: we need twenty five flat whites and that'll do it

 25 grande flat white (502)                    502
~~~
### Attributes
One leading attribute

~~~
speaker: how about a tall cappuccino

  1 tall cappuccino (401)                      401
~~~
Two leading attributes
~~~
speaker: i'd like a venti iced latte

  1 iced venti latte (605)                     605
~~~
Two leading attributes, different order
~~~
speaker: i'd like a iced venti latte

  1 iced venti latte (605)                     605
~~~
Two attributes, one leading and one trailing
~~~
speaker: i'd like a venti latte iced

  1 iced venti latte (605)                     605
~~~
Two trailing attributes
~~~
speaker: i'd like a latte iced venti

  1 iced venti latte (605)                     605
~~~
Adding a product with conflicting attributes
~~~
speaker: we'll also have a short tall latte

  1 short latte (600)                          600
~~~
### Options
One simple, trailing option

~~~
speaker: i wanna latte macchiato with vanilla

  1 grande latte macchiato (702)               702
    1 vanilla syrup (2502)                    2502
~~~
One simple, leading attribute
~~~
speaker: how about a peppermint latte

  1 grande latte (602)                         602
    1 peppermint syrup (2202)                 2202
~~~
Multiple simple leading and trailing options
~~~
speaker: may i also get a decaf soy vanilla syrup caramel latte with sugar and foam

  1 grande latte (602)                         602
    1 decaf (3000)                            3000
    1 soy milk (3600)                         3600
    1 vanilla syrup (2502)                    2502
    1 caramel syrup (1802)                    1802
    1 sugar (6602)                            6602
    1 foam (5202)                             5202
~~~
adding drink with option repeated
~~~
speaker: i want a latte with peppermint syrup with peppermint syrup

  1 grande latte (602)                         602
    1 peppermint syrup (2202)                 2202
~~~
Adding a drink with two options in same exclusion set
~~~
speaker: i'd like a decaf half caf latte

  1 grande latte (602)                         602
    1 decaf (3000)                            3000
~~~
Adding a drink with two options in same exclusion set
~~~
speaker: can I get a skim soy latte

  1 grande latte (602)                         602
    1 nonfat milk (3400)                      3400
~~~
leading attributed option
~~~
speaker: i'd like a light nutmeg espresso that's it

  1 doppio espresso (1001)                    1001
    1 light nutmeg (5401)                     5401
~~~

~~~
speaker: can i have an cappuccino no foam

  1 grande cappuccino (402)                    402
    1 no foam (5200)                          5200
~~~
trailing attributed option after conjunction
~~~
speaker: can i have an espresso with no nutmeg

  1 doppio espresso (1001)                    1001
    1 no nutmeg (5400)                        5400
~~~
Multiple leading and trailing attributed options
~~~
speaker: we want a light whipped no foam mocha with extra hazelnut and cinnamon

  1 grande mocha (802)                         802
    1 light whipped cream (5501)              5501
    1 no foam (5200)                          5200
    1 extra hazelnut syrup (2003)             2003
    1 cinnamon syrup (1902)                   1902
~~~
Attempt to add drink with illegal option
~~~
speaker: i'd like a latte cut in half

  1 grande latte (602)                         602
~~~
Attempt to add drink with illegal option
~~~
speaker: i'd like a strawberry latte

  1 grande latte (602)                         602
~~~
One leading, quantified option with units
~~~
speaker: i want a five pump caramel flat white

  1 grande flat white (502)                    502
    5 caramel syrup (1802)                    1802
~~~
One trailing, quantified option with units
~~~
speaker: i want a flat white with five pumps of caramel syrup

  1 grande flat white (502)                    502
    5 caramel syrup (1802)                    1802
~~~
Multiple leading and trailing quantified options, some with units
~~~
speaker: i want a two pump peppermint three squirt raspberry skinny vanilla latte with a pump of caramel and two sugars

  1 grande latte (602)                         602
    2 peppermint syrup (2202)                 2202
    3 raspberry syrup (2302)                  2302
    1 nonfat milk (3400)                      3400
    1 vanilla syrup (2502)                    2502
    1 caramel syrup (1802)                    1802
    2 sugar (6602)                            6602
~~~
### Multiple Items
Add a comma-separated list of products

~~~
speaker: i want a latte cappuccino espresso and an apple muffin

  1 grande latte (602)                         602
  1 grande cappuccino (402)                    402
  1 doppio espresso (1001)                    1001
  1 apple bran muffin (10000)                10000
~~~
Add a comma-separated list of products with attributes and options
~~~
speaker: i'd like a tall decaf latte iced a grande cappuccino double espresso and a warmed poppyseed muffin sliced in half

  1 iced tall latte (603)                      603
    1 decaf (3000)                            3000
  1 grande cappuccino (402)                    402
  1 doppio espresso (1001)                    1001
  1 lemon poppyseed muffin (10200)           10200
    1 warmed (200)                             200
    1 cut in half (300)                        300
~~~
Adding correct overloaded option, depending on context
~~~
speaker: we'd like a latte with soy and a coffee with soy

  1 grande latte (602)                         602
    1 soy milk (3600)                         3600
  1 grande dark roast coffee (1502)           1502
    1 soy milk creamer (4500)                 4500
~~~
## Removing Items and Options
### Removing Items
Remove by complete generic name

~~~
speaker: i want a latte latte macchiato and a chai latte

  1 grande latte (602)                         602
  1 grande latte macchiato (702)               702
  1 grande chai latte (902)                    902

speaker: remove the latte macchiato

  1 grande latte (602)                         602
  1 grande chai latte (902)                    902
~~~
Remove by generic name, partial match
~~~
speaker: i want a tall latte a short latte macchiato and a chai latte

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
  1 grande chai latte (902)                    902

speaker: remove the chai

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
~~~
Remove by leading attribute
~~~
speaker: i want a tall latte a short latte macchiato and a chai latte

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
  1 grande chai latte (902)                    902

speaker: remove the short latte

  1 tall latte (601)                           601
  1 grande chai latte (902)                    902
~~~
Remove by leading attribute
~~~
speaker: i want a tall latte a short latte macchiato and an iced chai latte

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
  1 iced grande chai latte (904)               904

speaker: remove the iced latte

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
~~~
Remove by trailing attribute
~~~
speaker: i want a tall latte a short latte macchiato and an iced chai latte

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
  1 iced grande chai latte (904)               904

speaker: remove the latte iced

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
~~~
Remove by multiple attributes
~~~
speaker: i want an iced tall latte a short latte macchiato and an iced chai latte

  1 iced tall latte (603)                      603
  1 short latte macchiato (700)                700
  1 iced grande chai latte (904)               904

speaker: remove the tall latte iced

  1 short latte macchiato (700)                700
  1 iced grande chai latte (904)               904
~~~
Remove implicit
~~~
speaker: i want an iced tall latte a short latte macchiato and an iced chai latte

  1 iced tall latte (603)                      603
  1 short latte macchiato (700)                700
  1 iced grande chai latte (904)               904

speaker: remove that

  1 iced tall latte (603)                      603
  1 short latte macchiato (700)                700
~~~
### Removing Options
This is a placeholder test used as a reminder to add in the full
set of cases for removing options.

~~~
speaker: This is a placeholder test that is designed to fail.

  1 iced tall latte (603)                      603
~~~
## Modifying items
Add option x to product y
~~~
speaker: i want a latte and an espresso

  1 grande latte (602)                         602
  1 doppio espresso (1001)                    1001

speaker: add extra vanilla syrup to the latte

  1 grande latte (602)                         602
    1 extra vanilla syrup (2503)              2503
  1 doppio espresso (1001)                    1001
~~~
Make that with option X
~~~
speaker: i want a latte and an espresso

  1 grande latte (602)                         602
  1 doppio espresso (1001)                    1001

speaker: make that with extra vanilla syrup

  1 grande latte (602)                         602
    1 extra vanilla syrup (2503)              2503
  1 doppio espresso (1001)                    1001
~~~
make that a triple
~~~
speaker: i want a latte and an espresso

  1 grande latte (602)                         602
  1 doppio espresso (1001)                    1001

speaker: make that a triple

  1 grande latte (602)                         602
  1 triple espresso (1002)                    1002
~~~
add option x to product y
~~~
speaker: i want a latte and an espresso

  1 grande latte (602)                         602
  1 doppio espresso (1001)                    1001

speaker: add whipped cream to the espresso

  1 grande latte (602)                         602
  1 doppio espresso (1001)                    1001
    1 whipped cream (5502)                    5502
~~~
add option x and option y to product z
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: add vanilla syrup and honey to that

  1 grande latte (602)                         602
    1 vanilla syrup (2502)                    2502
    1 honey (6402)                            6402
~~~
add a mutually exclusive option - make that option x
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: make that latte decaf

  1 grande latte (602)                         602
    1 decaf (3000)                            3000
~~~
change a mutually exclusive option - make that product x option y
~~~
speaker: i want a half caf latte

  1 grande latte (602)                         602
    1 half caf (2800)                         2800

speaker: make that latte decaf

  1 grande latte (602)                         602
    1 decaf (3000)                            3000
~~~
change a mutually exclusive option, implicit - make that option y
~~~
speaker: i want a half caf latte

  1 grande latte (602)                         602
    1 half caf (2800)                         2800

speaker: make that decaf

  1 grande latte (602)                         602
    1 decaf (3000)                            3000
~~~
change an attribute - make that product x attribute y
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: make that latte iced

  1 iced grande latte (604)                    604
~~~
change an attribute, implicit - make that attribute y
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: make that iced

  1 iced grande latte (604)                    604
~~~
add a mutually exclusive option - make product x with y
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: make that latte with soy

  1 grande latte (602)                         602
    1 soy milk (3600)                         3600
~~~
add a mutually exclusive option, implicit - make that with option y
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: make that with soy

  1 grande latte (602)                         602
    1 soy milk (3600)                         3600
~~~
add a mutually exclusive option, implicit - change that to option y
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: change that to soy

  1 grande latte (602)                         602
    1 soy milk (3600)                         3600
~~~
change a mutually exclusive option - change that product x to option y
~~~
speaker: we'd like a cappuccino

  1 grande cappuccino (402)                    402

speaker: change that cappuccino to decaf

  1 grande cappuccino (402)                    402
    1 decaf (3000)                            3000
~~~
change quantity of an option - make that prduct x with n of option y
~~~
speaker: we'd like a cappuccino with two pumps of vanilla

  1 grande cappuccino (402)                    402
    2 vanilla syrup (2502)                    2502

speaker: make that cappuccino with three pumps of vanilla

  1 grande cappuccino (402)                    402
    3 vanilla syrup (2502)                    2502
~~~
change the quantity of an option that is not mutually exclusive - make that product x with n option y
~~~
speaker: we'd like a cappuccino with a pack of sugar

  1 grande cappuccino (402)                    402
    1 sugar (6602)                            6602

speaker: make that cappuccino with two packs of sugar

  1 grande cappuccino (402)                    402
    2 sugar (6602)                            6602
~~~
change the quantity of an option that is not mutually exclusive, implicit - make that product x with n option y
~~~
speaker: we'd like a cappuccino with a pack of sugar

  1 grande cappuccino (402)                    402
    1 sugar (6602)                            6602

speaker: make that with two packs of sugar

  1 grande cappuccino (402)                    402
    2 sugar (6602)                            6602
~~~
add an additional quantity of existing option - add n option y to product x
~~~
speaker: i'd like a flat white with two equal

  1 grande flat white (502)                    502
    2 equal (6302)                            6302

speaker: add three equal to the flat white

  1 grande flat white (502)                    502
    5 equal (6302)                            6302
~~~
add an additional quantity of existing option, implicit - add n option y to that
~~~
speaker: i'd like a flat white with two equal

  1 grande flat white (502)                    502
    2 equal (6302)                            6302

speaker: add three equal to that

  1 grande flat white (502)                    502
    5 equal (6302)                            6302
~~~
change an attribute - change that product x to attribute y
~~~
speaker: we would like a latte

  1 grande latte (602)                         602

speaker: change that latte to a tall

  1 tall latte (601)                           601
~~~
change an attribute, implict - make that attribute y
~~~
speaker: we would like a latte

  1 grande latte (602)                         602

speaker: make that latte tall

  1 tall latte (601)                           601
~~~
change an attribute, implicit - change that to attribute y
~~~
speaker: we would like a latte

  1 grande latte (602)                         602

speaker: change that to a tall

  1 tall latte (601)                           601
~~~
change two attributes, implicit - change that to attribute y and attribute z
~~~
speaker: we would like a latte

  1 grande latte (602)                         602

speaker: change that to a tall and iced

  1 iced tall latte (603)                      603
~~~
change an attribute and add an option
~~~
speaker: i'd like a latte

  1 grande latte (602)                         602

speaker: make that latte iced and decaf

  1 iced grande latte (604)                    604
    1 decaf (3000)                            3000
~~~
explicit target change mutually exclusive option
~~~
speaker: i'd like a cappuccino

  1 grande cappuccino (402)                    402

speaker: change that cappuccino to a decaf

  1 grande cappuccino (402)                    402
    1 decaf (3000)                            3000
~~~
explicit target change mutually exclusive option
~~~
speaker: i'd like a cappuccino

  1 grande cappuccino (402)                    402

speaker: make that cappuccino half decaf

  1 grande cappuccino (402)                    402
    1 half caf (2800)                         2800
~~~
implicit target change a mutually exclusive option - make that option y
~~~
speaker: i'd like a flat white

  1 grande flat white (502)                    502

speaker: make that half caf

  1 grande flat white (502)                    502
    1 half caf (2800)                         2800
~~~
implicit target change a mutually exclusive option - change that to option y
~~~
speaker: i'd like a flat white

  1 grande flat white (502)                    502

speaker: change that to a half caf

  1 grande flat white (502)                    502
    1 half caf (2800)                         2800
~~~
implicit target change an attribute - make that attribute Z
~~~
speaker: can i get a latte

  1 grande latte (602)                         602

speaker: make that a tall

  1 tall latte (601)                           601
~~~
implicit target add option - add option y to that
~~~
speaker: get me an espresso

  1 doppio espresso (1001)                    1001

speaker: add cream to that

  1 doppio espresso (1001)                    1001
    1 half and half (4900)                    4900
~~~
implicit target add option - add option y
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: add peppermint syrup

  1 grande latte (602)                         602
    1 peppermint syrup (2202)                 2202
~~~
implicit target add option - can you make that with option y
~~~
speaker: i want a latte

  1 grande latte (602)                         602

speaker: can you make that with foam

  1 grande latte (602)                         602
    1 foam (5202)                             5202
~~~
implicit target add option - i want that with option y
~~~
speaker: i'd like a latte

  1 grande latte (602)                         602

speaker: i want that with a lid

  1 grande latte (602)                         602
    1 lid (5800)                              5800
~~~
change one product into another, implicit, preserving options and attributes - actually make that a product x
~~~
speaker: i'd like a decaf latte

  1 grande latte (602)                         602
    1 decaf (3000)                            3000

speaker: actually make that a cappuccino

  1 grande cappuccino (402)                    402
    1 decaf (3000)                            3000
~~~
change one product into another, preserving options and attributes - make that product x product y
~~~
speaker: i want a decaf latte

  1 grande latte (602)                         602
    1 decaf (3000)                            3000

speaker: make that latte a cappuccino

  1 grande cappuccino (402)                    402
    1 decaf (3000)                            3000
~~~
change one product into another with different attribute - change product x to product y
~~~
speaker: i'd like a decaf latte

  1 grande latte (602)                         602
    1 decaf (3000)                            3000

speaker: change that latte to a half caf espresso

  1 doppio espresso (1001)                    1001
    1 half caf (2800)                         2800
~~~
replace one product with another - replace product x with product y
~~~
speaker: i want an espresso

  1 doppio espresso (1001)                    1001

speaker: replace that espresso with a tall iced latte

  1 iced tall latte (603)                      603
~~~
replace one product with another, implicit - change that to product x
~~~
speaker: i want an espresso

  1 doppio espresso (1001)                    1001

speaker: change that to a tall iced latte

  1 iced tall latte (603)                      603
~~~
replace one product with another, implicit - replace that with product x
~~~
speaker: i want an espresso

  1 doppio espresso (1001)                    1001

speaker: replace that with a tall iced latte

  1 iced tall latte (603)                      603
~~~
replace implicit item with another - change product x to a product y
~~~
speaker: get me an espresso

  1 doppio espresso (1001)                    1001

speaker: change that to a tall iced latte

  1 iced tall latte (603)                      603
~~~
add then remove in same utterance
~~~
speaker: get me a latte

  1 grande latte (602)                         602

speaker: remove the latte and add an espresso

  1 doppio espresso (1001)                    1001
~~~
remove then add in same utterance
~~~
speaker: get me a latte

  1 grande latte (602)                         602

speaker: get me an espresso and remove the latte

  1 doppio espresso (1001)                    1001
~~~
remove then add in same utterance
~~~
speaker: get me a latte

  1 grande latte (602)                         602

speaker: add an espresso and remove the latte

  1 doppio espresso (1001)                    1001
~~~
Two leading attributes
~~~
speaker: we'll also have a tall buttered rum cappuccino

  1 tall cappuccino (401)                      401
    1 buttered rum syrup (1702)               1702
~~~
## Extras
These are extra regression cases associated with bugs discovered
while testing.

lots of stop words and disfluencies
~~~
speaker: i'd ah i'd like a latte and um i need a second and and also an espresso

  1 grande latte (602)                         602
  1 doppio espresso (1001)                    1001
~~~
should remove the sugar
~~~
speaker: i want a coffee with two sugar

  1 grande dark roast coffee (1502)           1502
    2 sugar (6602)                            6602

speaker: make that no sugar

  1 grande dark roast coffee (1502)           1502
    1 no sugar (6600)                         6600
~~~
should remove the sugar
~~~
speaker: i want a coffee with two sugar

  1 grande dark roast coffee (1502)           1502
    2 sugar (6602)                            6602

speaker: make that without sugar

  1 grande dark roast coffee (1502)           1502
    1 no sugar (6600)                         6600
~~~
remove by product class
~~~
speaker: i want a coffee with two equal

  1 grande dark roast coffee (1502)           1502
    2 equal (6302)                            6302

speaker: make that without sweetener

  1 grande dark roast coffee (1502)           1502
~~~

~~~
speaker: i want a tall latte a short latte macchiato and a venti chai latte

  1 tall latte (601)                           601
  1 short latte macchiato (700)                700
~~~
should not add a second whipped cream
~~~
speaker: i want a latte with whip

  1 grande latte (602)                         602
    1 whipped cream (5502)                    5502

speaker: i want whip on that

  1 grande latte (602)                         602
    1 whipped cream (5502)                    5502
    1 whipped cream (5502)                    5502
~~~
should remove the whipped cream
~~~
speaker: i want a latte with whip

  1 grande latte (602)                         602
    1 whipped cream (5502)                    5502

speaker: remove the whip

  1 grande latte (602)                         602
    1 whipped cream (5502)                    5502
~~~
should remove the vanilla - says not implemented
~~~
speaker: i want a vanilla latte

  1 grande latte (602)                         602
    1 vanilla syrup (2502)                    2502

speaker: remove the vanilla

  1 grande latte (602)                         602
    1 vanilla syrup (2502)                    2502
~~~
can we have a product x
~~~
speaker: can we have a latte

  1 grande latte (602)                         602
~~~
make that not iced
~~~
speaker: give me an iced latte

  1 iced grande latte (604)                    604

speaker: make that not iced

  1 grande latte (602)                         602
~~~
change option on one of two items
~~~
speaker: i'd like a latte and a flat white

  1 grande latte (602)                         602
  1 grande flat white (502)                    502

speaker: make that latte decaf

  1 grande latte (602)                         602
    1 decaf (3000)                            3000
  1 grande flat white (502)                    502
~~~
Remove option
~~~
speaker: i want a peppermint latte

  1 grande latte (602)                         602
    1 peppermint syrup (2202)                 2202

speaker: remove the peppermint

  1 grande latte (602)                         602
~~~
Should add a latte
~~~
speaker: add a latte

  1 grande latte (602)                         602
~~~
multi-step order product then modify
~~~
speaker: i'd like a muffin

  1 apple bran muffin (10000)                10000

speaker: i'd like that warmed

  1 apple bran muffin (10000)                10000
    1 warmed (200)                             200
~~~
room for cream should not add cream
~~~
speaker: i'd like a coffee with room for cream

  1 grande dark roast coffee (1502)           1502
    1 with room (5900)                        5900
~~~
room for cream should not add cream
~~~
speaker: i'd like a coffee

  1 grande dark roast coffee (1502)           1502

speaker: can you make that with room for cream

  1 grande dark roast coffee (1502)           1502
    1 with room (5900)                        5900
~~~
multi-step add option with product name afterwards
~~~
speaker: can i get a coffee

  1 grande dark roast coffee (1502)           1502

speaker: can i get room in that coffee

  1 grande dark roast coffee (1502)           1502
    1 with room (5900)                        5900
~~~
multi-step should add room to coffee
~~~
speaker: i want a coffee and an espresso

  1 grande dark roast coffee (1502)           1502
  1 doppio espresso (1001)                    1001

speaker: can i get room in the coffee

  1 grande dark roast coffee (1502)           1502
    1 with room (5900)                        5900
  1 doppio espresso (1001)                    1001
~~~
adds togo to the wrong item
~~~
speaker: add a latte

  1 grande latte (602)                         602

speaker: add an americano

  1 grande latte (602)                         602
  1 grande americano (1402)                   1402

speaker: make that to go

  1 grande latte (602)                         602
  1 grande americano (1402)                   1402
    1 to go (6000)                            6000
~~~
this one seems to work
~~~
speaker: add a latte

  1 grande latte (602)                         602

speaker: add an americano

  1 grande latte (602)                         602
  1 grande americano (1402)                   1402

speaker: make that americano to go

  1 grande latte (602)                         602
  1 grande americano (1402)                   1402
    1 to go (6000)                            6000
~~~
Should replace peppermint with extra peppermint
~~~
speaker: add a latte with peppermint

  1 grande latte (602)                         602
    1 peppermint syrup (2202)                 2202

speaker: make that with extra peppermint

  1 grande latte (602)                         602
    1 extra peppermint syrup (2203)           2203
~~~
should add whole milk creamer to coffee. Question: what about the half and half?
~~~
speaker: add a nonfat latte and a coffee with half and half

  1 grande latte (602)                         602
  1 grande dark roast coffee (1502)           1502
    1 half and half (4900)                    4900
    1 whole milk creamer (4000)               4000
~~~
should only add one lid
~~~
speaker: add a latte with a lid

  1 grande latte (602)                         602
    1 lid (5800)                              5800

speaker: make that with a lid

  1 grande latte (602)                         602
    1 lid (5800)                              5800
~~~
should remove the splenda
~~~
speaker: add a latte with splenda

  1 grande latte (602)                         602
    1 splenda (6502)                          6502

speaker: remove the splenda

  1 grande latte (602)                         602
~~~
shoud put no foam on second drink
~~~
speaker: add a mocha and an iced grande latte with extra foam

  1 grande mocha (802)                         802
  1 iced grande latte (604)                    604
    1 extra foam (5203)                       5203

speaker: make that with no foam

  1 grande mocha (802)                         802
  1 iced grande latte (604)                    604
    1 no foam (5200)                          5200
~~~
should only have on no foam
~~~
speaker: add a latte with no foam

  1 grande latte (602)                         602
    1 no foam (5200)                          5200

speaker: make that with no foam

  1 grande latte (602)                         602
    1 no foam (5200)                          5200
~~~
demonstrated an option with the same name as an attribute
~~~
speaker: i want a short iced latte

  1 short latte (600)                          600
    1 ice (5302)                              5302
~~~
Disfluency prevents order
~~~
speaker: Hi um i'd like a ah a latte with vanilla syrup

  1 grande latte (602)                         602
    1 vanilla syrup (2502)                    2502
~~~
Should not add a second muffin
~~~
speaker: i'd like a muffin

  1 apple bran muffin (10000)                10000

speaker: and can you warm the muffin

  1 apple bran muffin (10000)                10000
    1 warmed (200)                             200
~~~
option-as-verb should warm the muffin
~~~
speaker: i'd like a muffin

  1 apple bran muffin (10000)                10000

speaker: warm that

  1 apple bran muffin (10000)                10000
    1 warmed (200)                             200
~~~
option-as-verb should slice the muffin
~~~
speaker: add a muffin

  1 apple bran muffin (10000)                10000

speaker: slice the muffin

  1 apple bran muffin (10000)                10000
    1 cut in half (300)                        300
~~~