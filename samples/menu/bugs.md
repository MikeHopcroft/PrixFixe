~~~
% i added a decaf latte

  1 grande latte (10202)                     3:0:2
    1 decaf (12300)                           402:



% i made that half caf

  1 grande latte (10202)                     3:0:2
    1 half caf (12200)                        401:



% i added a cinnamon americano

  1 grande latte (10202)                     3:0:2
    1 half caf (12200)                        401:
  1 grande americano (10902)               200:0:2
    1 cinnamon (11402)                       303:2



% i made that to go

  1 grande latte (10202)                     3:0:2
    1 half caf (12200)                        401:
    1 to go (15300)                           803:   ********* "that" should have referred to the second drink
  1 grande americano (10902)               200:0:2
    1 cinnamon (11402)                       303:2



% i made that americano to go

(node:34804) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'attributes' of undefined
    at AttributeInfo.getAttributes (D:\git\menubot\PrixFixe\build\src\attributes\attribute_info.js:147:41)
    at addTokens (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\target.js:27:38)
    at addTokens (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\target.js:35:9)
    at subgraphFromItems (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\target.js:16:9)
    at Object.productTargets (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\target.js:112:22)
    at productTargets.next (<anonymous>)
    at parseAddToTarget (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\modify.js:127:16)
    at processModify1 (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\modify.js:91:36)
    at Object.processModify (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\modify.js:65:20)
    at processAllActiveRegions (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\root.js:137:45)
(node:34804) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). To terminate the node process on unhandled promise rejection, use the CLI flag `--unhandled-rejections=strict` (see https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode). (rejection id: 2)
(node:34804) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.


bye
~~~

Simpler repro
~~~
% i added a half caf latte to go an an americano

  1 grande latte (10202)                     3:0:2
    1 half caf (12200)                        401:
  1 grande americano (10902)               200:0:2



% i made that americano to go

(node:20492) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'attributes' of undefined
    at AttributeInfo.getAttributes (D:\git\menubot\PrixFixe\build\src\attributes\attribute_info.js:147:41)
~~~

~~~
Continuing from previous
% made that latte soy

(node:20492) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'attributes' of undefined
    at AttributeInfo.getAttributes (D:\git\menubot\PrixFixe\build\src\attributes\attribute_info.js:147:41)
    at addTokens (D:\git\menubot\MochaJava\node_modules\short-order\build\src\parser\target.js:27:38)
~~~


Should replace peppermint with extra peppermint
~~~
  1 grande latte (10202)                     3:0:2
    1 nonfat milk (12700)                     503:
    1 cinnamon (11402)                       303:2
    1 peppermint (11702)                     306:2



% i added extra peppermint

  1 grande latte (10202)                     3:0:2
    1 nonfat milk (12700)                     503:
    1 cinnamon (11402)                       303:2
    1 peppermint (11702)                     306:2
    1 extra peppermint (11703)               306:3
~~~

Should add milk to second drink
~~~
  1 grande latte (10202)                     3:0:2
    1 nonfat milk (12700)                     503:
    1 cinnamon (11402)                       303:2
    1 peppermint (11702)                     306:2
    1 extra peppermint (11703)               306:3
  1 grande dark roast coffee (11002)       201:0:2
    1 half and half (14200)                   609:



% i added milk

  1 grande latte (10202)                     3:0:2
    1 whole milk (12400)                      500:
    1 cinnamon (11402)                       303:2
    1 peppermint (11702)                     306:2
    1 extra peppermint (11703)               306:3
  1 grande dark roast coffee (11002)       201:0:2
    1 half and half (14200)                   609:
~~~

Should have added a lid
~~~
  1 grande latte (10202)                     3:0:2
    1 whole milk (12400)                      500:
    1 decaf (12300)                           402:
    5 vanilla (12002)                        309:2



% i made that to go with a lid

  1 grande latte (10202)                     3:0:2
    1 whole milk (12400)                      500:
    1 decaf (12300)                           402:
    5 vanilla (12002)                        309:2
    1 to go (15300)                           803:



% i made that with a lid

  1 grande latte (10202)                     3:0:2
    1 whole milk (12400)                      500:
    1 decaf (12300)                           402:
    5 vanilla (12002)                        309:2
    1 to go (15300)                           803:
    1 lid (15100)                             801:
~~~

Should remove the splenda
~~~
  1 grande latte (10202)                     3:0:2
    1 whole milk (12400)                      500:
    1 decaf (12300)                           402:
    5 vanilla (12002)                        309:2
    1 to go (15300)                           803:
    1 lid (15100)                             801:
    5 splenda (15702)                        901:2



% i removed the splenda

remove OPTION from IMPLICIT (1)
parseRemoveOptionFromImplicit() not implemented.
  1 grande latte (10202)                     3:0:2
    1 whole milk (12400)                      500:
    1 decaf (12300)                           402:
    5 vanilla (12002)                        309:2
    1 to go (15300)                           803:
    1 lid (15100)                             801:
    5 splenda (15702)                        901:2
~~~

Shoud put foam on second drink. Should not add 'no foam' twice
~~~
  1 grande mocha (10402)                     5:0:2
    1 lid (15100)                             801:
    1 to go (15300)                           803:
  1 iced grande latte (10204)                3:1:2
    1 vanilla (12002)                        309:2
    1 extra foam (14503)                     701:3
    1 lid (15100)                             801:



% i made that with no foam

  1 grande mocha (10402)                     5:0:2
    1 lid (15100)                             801:
    1 to go (15300)                           803:
    1 no foam (14500)                        701:0
  1 iced grande latte (10204)                3:1:2
    1 vanilla (12002)                        309:2
    1 extra foam (14503)                     701:3
    1 lid (15100)                             801:



% i added no foam

  1 grande mocha (10402)                     5:0:2
    1 lid (15100)                             801:
    1 to go (15300)                           803:
    1 no foam (14500)                        701:0
    1 no foam (14500)                        701:0
  1 iced grande latte (10204)                3:1:2
    1 vanilla (12002)                        309:2
    1 extra foam (14503)                     701:3
    1 lid (15100)                             801:
~~~

Shouldn't add "no foam" twice
~~~
  1 grande latte (10202)                     3:0:2
    1 no foam (14500)                        701:0



% i added no foam

  1 grande latte (10202)                     3:0:2
    1 no foam (14500)                        701:0
    1 no foam (14500)                        701:0
~~~

Is this the best interpretation (since short iced is not a legal form)?
~~~
% i added a short iced latte

  1 short latte (10200)                      3:0:0
    1 ice (14602)                            702:2
~~~
