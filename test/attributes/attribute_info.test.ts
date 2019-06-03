import { assert } from 'chai';
import 'mocha';

import {
    AID,
    DID,
    Dimension,
    Tensor,
    TID,
    PID,
    AttributeInfo,
    TensorEntityBuilder,
    UID,
} from '../../src/';

import {
    caffeines,
    emptyAttributes,
    flavor,
    flavorChocolate,
    flavorDimension,
    flavorVanilla,
    genericCone,
    mediumVanillaCone,
    size,
    sizeDimension,
    sizeMedium,
    sizes,
    sizeSmall,
    smallChocolateCone,
    smallWorldAttributes,
    smallWorldCatalog,
    softServeDimensions,
    unknownPID,
    smallIcedDecafCoffee,
    temperatureCold,
    caffeineDecaf,
} from '../shared';

///////////////////////////////////////////////////////////////////////////
//
//  AttributeInfo
//
///////////////////////////////////////////////////////////////////////////
describe('AttributeInfo', () => {
    it('addDimension()', () => {
        const info = new AttributeInfo(smallWorldCatalog, emptyAttributes);

        info['addDimension'](softServeDimensions[0]);
        info['addDimension'](softServeDimensions[1]);

        const cases = [
            // Sizes
            {
                aid: sizeSmall,
                coordinate: { dimension: sizeDimension, position: 0 },
            },
            {
                aid: sizeMedium,
                coordinate: { dimension: sizeDimension, position: 1 },
            },

            // Flavors
            {
                aid: flavorVanilla,
                coordinate: { dimension: flavorDimension, position: 0 },
            },
            {
                aid: flavorChocolate,
                coordinate: { dimension: flavorDimension, position: 1 },
            },
        ];

        for (const test of cases) {
            const observed = info.getAttributeCoordinates(test.aid);
            const expected = test.coordinate;
            assert.deepEqual(observed, expected);
        }
    });

    it('addDimension() - exceptions', () => {
        const info = new AttributeInfo(smallWorldCatalog, emptyAttributes);
        info['addDimension'](softServeDimensions[0]);

        // Attempt adding a dimension with the same id.
        const f1 = () => info['addDimension'](softServeDimensions[0]);
        assert.throws(f1, `found duplicate dimension id 0.`);

        // Attempt adding an attribute with a duplicate pid.
        const uniqueId: UID = softServeDimensions[0].did + 1;
        const sizesDimension = new Dimension(uniqueId, 'sizes', sizes.values());
        const f2 = () => info['addDimension'](sizesDimension);
        assert.throws(f2, `found duplicate attribute pid 0.`);
    });

    it('addTensor()', () => {
        const info = new AttributeInfo(smallWorldCatalog, emptyAttributes);

        const anyTensorId: TID = 123;
        const tensor: Tensor = {
            tid: anyTensorId,
            dimensions: softServeDimensions,
        };

        info['addTensor'](tensor);

        const f = () => info['addTensor'](tensor);
        assert.throws(f, 'found duplicate tensor id 123.');
    });

    it('getKey()', () => {
        const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);

        const dimensionIdToAttribute = new Map<DID, AID>();
        dimensionIdToAttribute.set(size, sizeMedium);
        dimensionIdToAttribute.set(flavor, flavorVanilla);

        const genericConePID = 8000;

        // genericConePID:   8000
        //         medium:   1
        //        vanilla:   0
        //            key:   8000:1:0
        assert.equal(
            info.getKey(genericConePID, dimensionIdToAttribute),
            `${genericConePID}:1:0`
        );
    });

    it('getAttributes()', () => {
        const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);

        const aids = info.getAttributes(smallIcedDecafCoffee.key);
        assert.deepEqual(aids, [sizeSmall, temperatureCold, caffeineDecaf]);
    });
});
