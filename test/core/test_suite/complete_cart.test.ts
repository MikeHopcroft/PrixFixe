import { assert } from 'chai';
import 'mocha';

import { LogicalCart, cartIsComplete } from '../../../src/core/test_suite';

import {
  product1a,
  product1b,
  product1c,
  product1d,
  product1e,
  product1f,
  product1g,
  product2a,
  product3a,
  cart1,
} from './shared';

describe('Complete Cart', () => {
  it('empty carts', () => {
    const cart1: LogicalCart = { items: [] };
    const cart2: LogicalCart = { items: [] };

    const complete = cartIsComplete(cart1, cart2);
    assert.isTrue(complete);
  });

  it('identical carts', () => {
    const complete = cartIsComplete(cart1, cart1);
    assert.isTrue(complete);
  });

  it('reordered products complete carts', () => {
    const cart2: LogicalCart = { items: [product3a, product2a, product1a] };

    const complete = cartIsComplete(cart1, cart2);
    assert.isTrue(complete);
  });

  it('reordered options complete carts', () => {
    const cart2: LogicalCart = {
      items: [
        product1b, // Differs from product1a in option order
        product2a,
        product3a,
      ],
    };

    const complete = cartIsComplete(cart1, cart2);
    assert.isTrue(complete);
  });

  it('different set of products', () => {
    const cart2: LogicalCart = { items: [product2a, product3a] };

    const complete = cartIsComplete(cart1, cart2);
    assert.isFalse(complete);
  });

  it('different product quanities', () => {
    const cart2: LogicalCart = {
      items: [
        product1c, // Differs from product1a in quantity only
        product2a,
        product3a,
      ],
    };

    const complete = cartIsComplete(cart1, cart2);
    assert.isFalse(complete);
  });

  it('different product skus', () => {
    const cart2: LogicalCart = {
      items: [
        product1d, // Differs from product1a in sku only
        product2a,
        product3a,
      ],
    };

    const complete = cartIsComplete(cart1, cart2);
    assert.isFalse(complete);
  });

  it('different set of options', () => {
    const cart2: LogicalCart = {
      items: [
        product1e, // Differs from product1a in set of options
        product2a,
        product3a,
      ],
    };

    const complete = cartIsComplete(cart1, cart2);
    assert.isFalse(complete);
  });

  it('different option quantities', () => {
    const cart2: LogicalCart = {
      items: [
        product1f, // Differs from product1a in first option quanity
        product2a,
        product3a,
      ],
    };

    const complete = cartIsComplete(cart1, cart2);
    assert.isFalse(complete);
  });

  it('different option skus', () => {
    const cart2: LogicalCart = {
      items: [
        product1g, // Differs from product1a in first option sku
        product2a,
        product3a,
      ],
    };

    const complete = cartIsComplete(cart1, cart2);
    assert.isFalse(complete);
  });
});
