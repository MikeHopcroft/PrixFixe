import { assert } from 'chai';
import 'mocha';

import { PID, AttributeInfo, TensorEntityBuilder } from '../../../src/core';

import {
  flavorChocolate,
  flavorVanilla,
  genericCone,
  mediumVanillaCone,
  sizeMedium,
  sizeSmall,
  smallChocolateCone,
  smallWorldAttributes,
  smallWorldCatalog,
  unknownPID,
} from '../../shared';

///////////////////////////////////////////////////////////////////////////
//
//  TensorEntityBuilder
//
///////////////////////////////////////////////////////////////////////////
describe('TensorEntityBuilder', () => {
  it('Constructor', () => {});

  it('hasPID()/setPID()', () => {
    const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);
    const builder = new TensorEntityBuilder(info);

    // Haven't added an entity yet.
    assert.isFalse(builder.hasPID());

    const anyPID: PID = 123;
    builder.setPID(anyPID);

    assert.isTrue(builder.hasPID());

    const f = () => builder.setPID(anyPID);
    assert.throws(f, 'attempting to overwrite entity 123 with 123');
  });

  it('addAttribute()', () => {
    const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);

    const builder = new TensorEntityBuilder(info);

    const f = () => builder.addAttribute(unknownPID);
    assert.throws(f, 'Unknown attribute id 9999.');

    // First time adding a size should succeed.
    assert.isTrue(builder.addAttribute(sizeSmall));

    // Second size addition should fail.
    assert.isFalse(builder.addAttribute(sizeMedium));

    // First time adding a flavor should succeed.
    assert.isTrue(builder.addAttribute(flavorChocolate));
  });

  it('setAttribute()', () => {
    const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);

    const builder = new TensorEntityBuilder(info);

    // Configure builder for small chocolate cone.
    builder.setPID(genericCone.pid);
    assert.isTrue(builder.addAttribute(sizeSmall));
    assert.isTrue(builder.addAttribute(flavorChocolate));
    assert.equal(builder.getKey(false), smallChocolateCone.key);

    // Now reconfigure for medium vanilla cone.
    builder.setAttribute(sizeMedium);
    builder.setAttribute(flavorVanilla);
    assert.equal(builder.getKey(false), mediumVanillaCone.key);
  });

  it('getKey()', () => {
    const info = new AttributeInfo(smallWorldCatalog, smallWorldAttributes);

    const genericConePID: PID = 8000;

    const builder = new TensorEntityBuilder(info);

    // getKey() before adding entity should throw.
    const f = () => builder.getKey(false);
    assert.throws(f, 'no pid set');

    // Add a cone entity.
    builder.setPID(genericConePID);

    // All attributes are default.
    assert.equal(builder.getKey(false), '8000:0:0');

    // Allow size to default, add flavor = chocolate.
    builder.addAttribute(flavorChocolate);
    assert.equal(builder.getKey(false), '8000:0:1');

    // Add size = medium, flavor is still chocolate.
    builder.addAttribute(sizeMedium);
    assert.equal(builder.getKey(false), '8000:1:1');
  });
});
