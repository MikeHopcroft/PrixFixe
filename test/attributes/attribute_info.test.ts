import { assert } from 'chai';
import 'mocha';

import {
    AID,
    DID,
    Dimension,
    Matrix,
    MID,
    PID,
    AttributeInfo,
    MatrixEntityBuilder,
    UID,
} from '../../src/';

import {
    smallWorldAttributes,
    caffeines,
    smallWorldCatalog,
    emptyAttributes,
    flavor,
    flavorChocolate,
    flavorDimension,
    flavorVanilla,
    size,
    sizeDimension,
    sizeMedium,
    sizes,
    sizeSmall,
    softServeDimensions,
    unknownPID,
} from '../shared';

describe('Attribute Info', () => {
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

    ///////////////////////////////////////////////////////////////////////////
    //
    //  Matrix
    //
    ///////////////////////////////////////////////////////////////////////////
    describe('Matrix', () => {
        it('Constructor', () => {
            const anyMatrixId: MID = 123;
            const matrix = { id: anyMatrixId, dimensions: softServeDimensions };

            assert.equal(matrix.id, anyMatrixId);
            assert.deepEqual(matrix.dimensions, softServeDimensions);
        });
    });

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
            const sizesDimension = new Dimension(
                uniqueId,
                'sizes',
                sizes.values()
            );
            const f2 = () => info['addDimension'](sizesDimension);
            assert.throws(f2, `found duplicate attribute pid 0.`);
        });

        it('addMatrix()', () => {
            const info = new AttributeInfo(smallWorldCatalog, emptyAttributes);

            const anyMatrixId: MID = 123;
            const matrix: Matrix = {
                mid: anyMatrixId,
                dimensions: softServeDimensions,
            };

            info['addMatrix'](matrix);

            const f = () => info['addMatrix'](matrix);
            assert.throws(f, 'found duplicate matrix id 123.');
        });

        it('getKey()', () => {
            const info = new AttributeInfo(
                smallWorldCatalog,
                smallWorldAttributes
            );

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
    });

    ///////////////////////////////////////////////////////////////////////////
    //
    //  MaxtrixEntityBuilder
    //
    ///////////////////////////////////////////////////////////////////////////
    describe('MaxtrixEntityBuilder', () => {
        it('Constructor', () => {});

        it('hasPID()/setPID()', () => {
            const info = new AttributeInfo(
                smallWorldCatalog,
                smallWorldAttributes
            );
            const builder = new MatrixEntityBuilder(info);

            // Haven't added an entity yet.
            assert.isFalse(builder.hasPID());

            const anyPID: PID = 123;
            builder.setPID(anyPID);

            assert.isTrue(builder.hasPID());

            const f = () => builder.setPID(anyPID);
            assert.throws(f, 'attempting to overwrite entity 123 with 123');
        });

        it('addAttribute()', () => {
            const info = new AttributeInfo(
                smallWorldCatalog,
                smallWorldAttributes
            );

            const builder = new MatrixEntityBuilder(info);

            const f = () => builder.addAttribute(unknownPID);
            assert.throws(f, 'Unknown attribute id 9999.');

            // First time adding a size should succeed.
            assert.isTrue(builder.addAttribute(sizeSmall));

            // Second size addition should fail.
            assert.isFalse(builder.addAttribute(sizeMedium));

            // First time adding a flavor should succeed.
            assert.isTrue(builder.addAttribute(flavorChocolate));
        });

        it('getKey()', () => {
            const info = new AttributeInfo(
                smallWorldCatalog,
                smallWorldAttributes
            );

            // TODO: this should not hard code 8000 here or below.
            const genericConePID: PID = 8000;

            const builder = new MatrixEntityBuilder(info);

            // getKey() before adding entity should throw.
            const f = () => builder.getKey();
            assert.throws(f, 'no pid set');

            // Add a cone entity.
            builder.setPID(genericConePID);

            // All attributes are default.
            assert.equal(builder.getKey(), '8000:0:0');

            // Allow size to default, add flavor = chocolate.
            builder.addAttribute(flavorChocolate);
            assert.equal(builder.getKey(), '8000:0:1');

            // Add size = medium, flavor is still chocolate.
            builder.addAttribute(sizeMedium);
            assert.equal(builder.getKey(), '8000:1:1');
        });
    });
});
