import { assert } from 'chai';
import 'mocha';

import { DID, Dimension } from '../../src/';

import { caffeines } from '../shared';

///////////////////////////////////////////////////////////////////////////
//
//  Dimension
//
///////////////////////////////////////////////////////////////////////////
describe('Dimension', () => {
  it('Constructor', () => {
    const anyDimensionId: DID = 123;
    const dimension = new Dimension(
      anyDimensionId,
      'caffeines',
      caffeines.values()
    );

    assert.equal(dimension.did, anyDimensionId);
    assert.deepEqual(dimension.attributes, caffeines);
  });

  it('No attributes', () => {
    const anyDimensionId = 123;
    const f = () => new Dimension(anyDimensionId, 'empty', [].values());

    assert.throws(f, 'expect at least one attribute');
  });
});
