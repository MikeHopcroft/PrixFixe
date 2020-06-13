import { assert } from 'chai';
import 'mocha';

import {
  AID,
  DID,
  Dimension,
  Tensor,
  TID,
  AttributeInfo,
  UID,
} from '../../src/';

import {
  caffeines,
  emptyAttributes,
  flavor,
  flavorChocolate,
  flavorDimension,
  flavorForbidden,
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
    const sizesDimension2 = new Dimension(uniqueId, 'sizes2', sizes.values());
    const f2 = () => info['addDimension'](sizesDimension2);
    assert.throws(f2, `found duplicate attribute pid 0.`);

    const sizesDimension3 = new Dimension(
      uniqueId + 1,
      'sizes',
      sizes.values()
    );
    const f3 = () => info['addDimension'](sizesDimension3);
    assert.throws(f3, `found duplicate dimension name "sizes".`);
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

  it('getKey(false)', () => {
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
      info.getKey(genericConePID, dimensionIdToAttribute, false),
      `${genericConePID}:1:0`
    );

    dimensionIdToAttribute.set(flavor, flavorForbidden);

    // The following case demonstrates that getKey() can return a key to an
    // item that is not in the catalog. This case rolls back commit e7ce0210.
    //
    // genericConePID:   8000
    //         medium:   1
    //      forbidden:   2
    //            key:   8000:1:2
    assert.equal(
      info.getKey(genericConePID, dimensionIdToAttribute, false),
      `${genericConePID}:1:2`
    );
  });

  it('getKey(true)', () => {
    const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);

    const genericConePID = 8000;
    const dimensionIdToAttribute = new Map<DID, AID>();

    // genericConePID:   8000
    //         medium:   unspecified
    //        vanilla:   unspecified
    //            key:   8000:\d+:\d+
    assert.equal(
      info.getKey(genericConePID, dimensionIdToAttribute, true),
      `${genericConePID}:\\d+:\\d+`
    );

    dimensionIdToAttribute.set(size, sizeMedium);

    // genericConePID:   8000
    //         medium:   1
    //        vanilla:   unspecified
    //            key:   8000:\d+:\d+
    assert.equal(
      info.getKey(genericConePID, dimensionIdToAttribute, true),
      `${genericConePID}:1:\\d+`
    );

    dimensionIdToAttribute.set(flavor, flavorVanilla);

    // genericConePID:   8000
    //         medium:   1
    //        vanilla:   0
    //            key:   8000:1:0
    assert.equal(
      info.getKey(genericConePID, dimensionIdToAttribute, true),
      `${genericConePID}:1:0`
    );
  });

  it('getAttributes()', () => {
    const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);

    const aids = info.getAttributes(smallIcedDecafCoffee.key);
    assert.deepEqual(aids, [sizeSmall, temperatureCold, caffeineDecaf]);
  });
});
