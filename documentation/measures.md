# Cart Comparison Measures

When testing voice ordering systems, we use three measures to compare a `submitted` shopping cart to the `expected` cart.
* **Perfect** - a submitted cart is said to be `perfect` if it has the same contents, _in the same order_, as the expected cart. 
* **Complete** - a submitted cart is said to be `complete` if it has the same contents, _in any order_.
* **Repair Cost** - the number of edits required to make the submitted cart `complete`.

The first two measures, `Perfect` and `Complete`, are easy to compute and require no knowledge of the menu or point-of-sale (POS) user interface. The `Perfect` metric is useful when the customer can see the order, live, as it is being entered and expects it to match the flow of the conversation. In situations where there is no live feedback, the `Complete` metric is important in ensuring that the customer actually receives the correct items. Because of their all-or-none nature, these two measures are mainly useful for systems with extremely low error-rates. 

In systems with even modest error rates, the `Perfect` and `Complete` measures may too blunt because a large number of nearly-complete orders will fail both measures. In this situation, the `Repair Cost` measure is needed to ascertain how close the cart comes to the ideal.

One challenge with the `Repair Cost` measure is that its implementation requires knowledge of the menu and assumptions about the user interface for correcting orders. Typically one can change an attribute (e.g. `tall` to `grande`) or a quantity (e.g. `1` to `2`) or delete a product or option in a single operation. Changing the base product (e.g. `latte` to `mocha`) or base option (e.g. `cinnamon syrup` to `vanilla syrup`) is more costly because it involves deleting a fully configured product and then adding and configuring a new product. Understanding the cost of configuring a newly added product requires knowledge of default quantities and attributes.

As an example, adding `5 iced tall lattes` would require four steps:
* Adding a `latte` which defaults to `1 grande latte`.
* Changing the size to `tall`.
* Changing the form to `iced`.
* Changing the quantity to `5`.

Adding one `latte` in the default size would require only one step:
* Adding a `latte` which defaults to `1 grande latte`.

In the following we consider nine scenarios that illustrate the `Perfect`, `Complete`, and `Repair Cost` measures. In each of the nine examples, below, we expect the following cart:

~~~
1 tall latte (601)
  1 no foam (5200)
  2 vanilla syrup (2502)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Here's a summary of the measures for each of the nine cases:

| Scenario  | Perfect  | Complete  | Repair |
|---|:-:|:-:|:-:|
| [Carts are identical](#carts-are-identical)                                               | ✔ | ✔ | 0 |
| [Products out of order](#products-out-of-order)                                          | 	:x: | ✔ | 0 |
| [Product SKU wrong because generic product is wrong](#product-sku-wrong-because-generic-product-is-wrong)                | :x: | :x: | varies |
| [Product SKU wrong because one or more attributes are wrong](#product-sku-wrong-because-one-or-more-attributes-are-wrong)        | :x: | :x: | varies |
| [Product quantity wrong](#product-quantity-wrong)                                            | :x: | :x: | 1 |
| [Options out of order](#options-out-of-order)                                              | :x: | ✔ | 0 |
| [Option SKU wrong because generic option is wrong](#option-sku-wrong-because-generic-option-is-wrong)                  | :x: | :x: | varies |
| [Option SKU wrong because one or more attributes are wrong](#option-sku-wrong-because-one-or-more-attributes-are-wrong)         | :x: | :x: | varies |
| [Option quantity wrong](#option-quantity-wrong)                                             | :x: | :x: | 1 |



## Carts are identical

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| ✔ | ✔ | 0 |

The expected cart is identical to the submitted cart:
~~~
1 tall latte (601)
  1 no foam (5200)
  2 vanilla syrup (2502)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Since the cart is `perfect` and `complete`, no repairs are required.

## Products out of order

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | ✔ | 0 |

In this case, the `apple bran muffin` appears before the `tall latte`.

~~~
1 apple bran muffin (10000)
  1 warmed (200)   
1 tall latte (601)
  1 no foam (5200)
  2 vanilla syrup (2502)
~~~

Since the cart is `complete`, no repairs are required.

## Product SKU wrong because generic product is wrong

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | :x: | 7 |

In this case, a `tall mocha` appears where we expect a `tall latte`.
~~~
1 tall mocha (801)
  1 no foam (5200)
  2 vanilla syrup (2502)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Repairing the cart involves seven edits:
* Remove the `tall mocha` along with its options.
* Add a `latte`, which is, by default, a `grande`.
* Change its size to `tall`.
* Add the `foam` option.
* Change its attribute to `no`.
* Add the `vanilla syrup option`
* Change its quantity to `2`.

One could image an alternatve point-of-sale (POS) UI that would allow one to replace the `mocha` with a `latte` while leaving its attributes, options, and quantities intact. In this case, the repair cost would be `1`.

## Product SKU wrong because one or more attributes are wrong

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | :x: | 2 |

In this case, `iced` and `venti` appear where `tall` was expected.

~~~
1 iced venti latte (605)
  1 no foam (5200)
  2 vanilla syrup (2502)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Repairing the cart involves two edits:
* Changing the `venti` attribute to `tall`.
* Removing the `iced` attribute.

## Product quantity wrong

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | :x: | 1 |

This cart contains `5` drinks where we expect `1`.
~~~
5 tall latte (601)
  1 no foam (5200)
  2 vanilla syrup (2502)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Repairing the case involves one edit:
* Change quantity to 5.

## Options out of order

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | ✔ | 0 |

In this cart, `vanilla syrup` appears before `no foam`.
~~~
1 tall latte (601)
  2 vanilla syrup (2502)
  1 no foam (5200)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Since the cart is `complete`, no repairs are required.


## Option SKU wrong because generic option is wrong

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | :x: | 3 |

In this cart, `cinnamon syrup` appears where we expect `vanilla syrup`.
~~~
1 tall latte (601)
  1 no foam (5200)
  2 cinnamon syrup (1902)
1 apple bran muffin (10000)
  1 warmed (200)
~~~

Repairing the cart involves three edits:
* Remove the `cinnamon syrup`.
* Add `vanilla syrup`.
* Change its quantity to `2`.

Again, one could imagine an alternative POS UI that would allow one to swap `vanilla syrup` for `cinnamon syrup`, while leaving the quatity intact. In this case, the repair cost would be `1`.

## Option SKU wrong because one or more attributes are wrong

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | :x: | 1 |

In this cart, `extra foam` appears where we expect `no foam`.
~~~
1 tall latte (601)
  1 extra foam (5203)
  2 vanilla syrup (2502)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Repairing the cart involves one edit:
* Change `extra` to `no`.

## Option quantity wrong

| Perfect | Complete | Repair |
|:-:|:-:|:-:|
| :x: | :x: | 1 |

This cart has `5 vanilla syrup` where we expect `2`:
~~~
1 tall latte (601)
  1 no foam (5200)
  5 vanilla syrup (2502)
1 apple bran muffin (10000)
  1 warmed (200)   
~~~

Repairing the cart involves one edit:
* Change syrup quantity from `5` to `2`.
