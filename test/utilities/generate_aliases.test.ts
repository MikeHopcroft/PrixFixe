import { assert } from 'chai';
import 'mocha';

import { aliasesFromPattern } from '../../src/core/utilities/generate_aliases';

describe('Alias Generation', () => {
  it('should expand plaintext to itself', () => {
    const pattern = 'helloworld';

    const expected = ['helloworld'];

    const observed = [...aliasesFromPattern(pattern)];
    assert.deepEqual(observed, expected);
  });

  it('should enumerate optionals', () => {
    const pattern = 'a [b,c] d';

    const expected = ['a b d', 'a c d', 'a d'];

    const observed = [...aliasesFromPattern(pattern)];
    assert.deepEqual(observed, expected);
  });

  it('should enumerate requireds', () => {
    const pattern = 'a (b,c) d';

    const expected = ['a b d', 'a c d'];

    const observed = [...aliasesFromPattern(pattern)];
    assert.deepEqual(observed, expected);
  });

  it('should throw on trailing commas', () => {
    const f = () => {
      const pattern = 'a []d,e,] (b,c,) d';
      const result = [...aliasesFromPattern(pattern)];
    };
    assert.throws(f, TypeError);
  });

  it('should remove extra whitespace', () => {
    const pattern =
      '[ very small , medium ] ( red, green )  marble [ rolling ]';

    const expected = [
      'very small red marble rolling',
      'very small red marble',
      'very small green marble rolling',
      'very small green marble',
      'medium red marble rolling',
      'medium red marble',
      'medium green marble rolling',
      'medium green marble',
      'red marble rolling',
      'red marble',
      'green marble rolling',
      'green marble',
    ];

    const observed = [...aliasesFromPattern(pattern)];
    assert.deepEqual(observed, expected);
  });

  it('should expand recursively', () => {
    const pattern = '(red,green,[light] blue)';

    const expected = ['red', 'green', 'light blue', 'blue'];

    const observed = [...aliasesFromPattern(pattern)];
    assert.deepEqual(observed, expected);
  });
});
