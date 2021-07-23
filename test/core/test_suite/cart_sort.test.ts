import { assert } from 'chai';
import 'mocha';

import { cartSort } from '../../../src/core/test_suite';

describe('cartSort', () => {
  it('sku', () => {
    const cart = {
      items: [
        { quantity: 1, name: '', sku: '3', children: [] },
        { quantity: 1, name: '', sku: '2', children: [] },
        { quantity: 1, name: '', sku: '1', children: [] },
      ],
    };

    const expected = {
      items: [
        { quantity: 1, name: '', sku: '1', children: [] },
        { quantity: 1, name: '', sku: '2', children: [] },
        { quantity: 1, name: '', sku: '3', children: [] },
      ],
    };

    const observed = cartSort(cart);
    assert.deepEqual(observed, expected);
  });

  it('quantity', () => {
    const cart = {
      items: [
        { quantity: 3, name: '', sku: '1', children: [] },
        { quantity: 2, name: '', sku: '1', children: [] },
        { quantity: 1, name: '', sku: '1', children: [] },
      ],
    };

    const expected = {
      items: [
        { quantity: 1, name: '', sku: '1', children: [] },
        { quantity: 2, name: '', sku: '1', children: [] },
        { quantity: 3, name: '', sku: '1', children: [] },
      ],
    };

    const observed = cartSort(cart);
    assert.deepEqual(observed, expected);
  });

  it('child count', () => {
    const cart = {
      items: [
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [
            { quantity: 1, name: '', sku: '2', children: [] },
            { quantity: 1, name: '', sku: '2', children: [] },
          ],
        },
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [{ quantity: 1, name: '', sku: '2', children: [] }],
        },
      ],
    };

    const expected = {
      items: [
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [{ quantity: 1, name: '', sku: '2', children: [] }],
        },
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [
            { quantity: 1, name: '', sku: '2', children: [] },
            { quantity: 1, name: '', sku: '2', children: [] },
          ],
        },
      ],
    };

    const observed = cartSort(cart);
    assert.deepEqual(observed, expected);
  });

  it('children', () => {
    const cart = {
      items: [
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [
            { quantity: 1, name: '', sku: '4', children: [] },
            { quantity: 1, name: '', sku: '3', children: [] },
          ],
        },
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [
            { quantity: 1, name: '', sku: '3', children: [] },
            { quantity: 1, name: '', sku: '2', children: [] },
          ],
        },
      ],
    };

    const expected = {
      items: [
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [
            { quantity: 1, name: '', sku: '2', children: [] },
            { quantity: 1, name: '', sku: '3', children: [] },
          ],
        },
        {
          quantity: 1,
          name: '',
          sku: '1',
          children: [
            { quantity: 1, name: '', sku: '3', children: [] },
            { quantity: 1, name: '', sku: '4', children: [] },
          ],
        },
      ],
    };

    const observed = cartSort(cart);
    assert.deepEqual(observed, expected);
  });
});
