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
        // We used to test dimension.defaultAttribute here. This value came
        // from attribute.isDefault - a property that no longer exists. We
        // now find the default from genericItem.
        // TODO: Add an equivalent default test for current project.
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

        assert.throws(f, `expect at least one attribute`);
    });
});
