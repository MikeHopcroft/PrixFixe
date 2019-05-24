import { assert } from 'chai';
import 'mocha';

import {
    AID,
    AttributeItem,
    Catalog,
    CID,
    DID,
    Dimension,
    GenericTypedEntity,
    KEY,
    Matrix,
    MENUITEM,
    MID,
    PID,
    SpecificTypedEntity,
    AttributeInfo,
    MatrixEntityBuilder,
    UID,
} from '../../src/';

// A PID that is not indexed in any data structure in this file. For testing
// error cases.
const unknownPID: PID = 9999;

// A key that is not indexed in any data structure in this file. For testing
// error cases.
const unknownKey: KEY = '9999:9:9:9';

// Generators to help in creation of the catalog. They take arrays of the
// genericItems and SpecificItems, and yield the results as iterables.
function* genericGenerator(generics: GenericTypedEntity[]): IterableIterator<GenericTypedEntity> {
    for (const item of generics) {
        yield item;
    }
}

function* specificGenerator(specifics: SpecificTypedEntity[]): IterableIterator<SpecificTypedEntity> {
    for (const item of specifics) {
        yield item;
    }
}

///////////////////////////////////////////////////////////////////////////////
//  Create the Generic Cone and coffee
///////////////////////////////////////////////////////////////////////////////
const genericConePID: PID = 8000;
const coneCID: CID = 100;
const genericCone: GenericTypedEntity = {
    pid: genericConePID,
    cid: coneCID,
    name: 'cone',
    aliases: [
        'cone',
        'ice cream [cone]',
    ],
    defaultKey: '8000:0:0',
    matrix: 1,
    kind: MENUITEM,
};

const genericcoffeePID: PID = 9000;
const coffeeCID: CID = 200;
const genericcoffee: GenericTypedEntity = {
    pid: genericcoffeePID,
    cid: coffeeCID,
    name: 'coffee',
    aliases: [
        'coffee',
    ],
    defaultKey: '9000:0:0:0',
    matrix: 2,
    kind: MENUITEM,
};

const genericItems: GenericTypedEntity[] = [genericCone, genericcoffee];
const genericItemsIterator: IterableIterator<GenericTypedEntity> =
    genericGenerator(genericItems);

///////////////////////////////////////////////////////////////////////////////
//  Create Size, Flavor, Temperature, and Caffeine Attributes
///////////////////////////////////////////////////////////////////////////////
const sizeSmall: AID = 0;
const sizeMedium: AID = 1;

const sizes: AttributeItem[] = [
    {
        aid: sizeSmall,
        name: 'small',
        aliases: ['small'],
    },
    {
        aid: sizeMedium,
        name: 'medium',
        aliases: ['medium'],
    },
];

const flavorVanilla: AID = 2;
const flavorChocolate: AID = 3;

const flavors: AttributeItem[] = [
    {
        aid: flavorVanilla,
        name: 'vanilla',
        aliases: ['vanilla'],
    },
    {
        aid: flavorChocolate,
        name: 'chocolate',
        aliases: ['chocolate'],
    },
];

const temperatureHot: AID = 4;
const temperatureCold: AID = 5;

const temperatures: AttributeItem[] = [
    {
        aid: temperatureHot,
        name: 'hot',
        aliases: ['hot'],
    },
    {
        aid: temperatureCold,
        name: 'cold',
        aliases: ['colr', ' iced'],
    },
];

const caffeineRegular: AID = 6;
const caffeineDecaf: AID = 7;

const caffeines: AttributeItem[] = [
    {
        aid: caffeineRegular,
        name: 'regular',
        aliases: ['regular'],
    },
    {
        aid: caffeineDecaf,
        name: 'decaf',
        aliases: ['decaf', 'unleaded'],
    },
];

///////////////////////////////////////////////////////////////////////////////
//  Dimensions for Soft Serve Ice Cream and coffees
///////////////////////////////////////////////////////////////////////////////
const size: DID = 0;
const flavor: DID = 1;
const temperature: DID = 2;
const caffeine: DID = 3;

const sizeDimension = new Dimension(size, sizes.values());
const flavorDimension = new Dimension(flavor, flavors.values());
const temperatureDimension = new Dimension(temperature, temperatures.values());
const caffeineDimension = new Dimension(caffeine, caffeines.values());

const softServeDimensions = [
    sizeDimension,
    flavorDimension,
];
const coffeeDimensions = [
    sizeDimension,
    temperatureDimension,
    caffeineDimension,
];

///////////////////////////////////////////////////////////////////////////////
//  Specific Cones (size, flavor)
///////////////////////////////////////////////////////////////////////////////
const smallVanillaCone: SpecificTypedEntity = {
    sku: 8001,
    name: 'small vanilla cone',
    key: '8000:0:0',
    kind: MENUITEM,
};

const smallChocolateCone: SpecificTypedEntity = {
    sku: 8002,
    name: 'small chocolate cone',
    key: '8000:0:1',
    kind: MENUITEM,
};

const mediumVanillaCone: SpecificTypedEntity = {
    sku: 8003,
    name: 'medium vanilla cone',
    key: '8000:1:0',
    kind: MENUITEM,
};

const mediumChocolateCone: SpecificTypedEntity = {
    sku: 8004,
    name: 'medium chocolate cone',
    key: '8000:1:1',
    kind: MENUITEM,
};

///////////////////////////////////////////////////////////////////////////////
//  Specific coffees (size, temperature, caffeine)
///////////////////////////////////////////////////////////////////////////////
const smallcoffee: SpecificTypedEntity = {
    sku: 9001,
    name: 'small coffee',
    key: '9000:0:0:0',
    kind: MENUITEM,
};

const smallDecafcoffee: SpecificTypedEntity = {
    sku: 9002,
    name: 'small coffee',
    key: '9000:0:0:1',
    kind: MENUITEM,
};

const smallIcedcoffee: SpecificTypedEntity = {
    sku: 9003,
    name: 'small coffee',
    key: '9000:0:1:0',
    kind: MENUITEM,
};

const smallIcedDecafcoffee: SpecificTypedEntity = {
    sku: 9004,
    name: 'small coffee',
    key: '9000:0:1:1',
    kind: MENUITEM,
};

const mediumcoffee: SpecificTypedEntity = {
    sku: 9005,
    name: 'medium coffee',
    key: '9000:1:0:0',
    kind: MENUITEM,
};

const mediumDecafcoffee: SpecificTypedEntity = {
    sku: 9006,
    name: 'medium decaf coffee',
    key: '9000:1:0:1',
    kind: MENUITEM,
};

const mediumIcedcoffee: SpecificTypedEntity = {
    sku: 9007,
    name: 'medium iced coffee',
    key: '9000:1:1:0',
    kind: MENUITEM,
};

const mediumIcedDecafcoffee: SpecificTypedEntity = {
    sku: 9008,
    name: 'medium iced decaf coffee',
    key: '9000:1:1:1',
    kind: MENUITEM,
};

const specificItems: SpecificTypedEntity[] = [
    smallVanillaCone,
    smallChocolateCone,
    mediumVanillaCone,
    mediumChocolateCone,
    smallcoffee,
    smallDecafcoffee,
    smallIcedcoffee,
    smallIcedDecafcoffee,
    mediumcoffee,
    mediumDecafcoffee,
    mediumIcedcoffee,
    mediumIcedDecafcoffee,
];

const specificItemsIterator: IterableIterator<SpecificTypedEntity> =
    specificGenerator(specificItems);

///////////////////////////////////////////////////////////////////////////////
//  Add the Maps to the Catalog
///////////////////////////////////////////////////////////////////////////////
const catalog = Catalog.fromEntities(genericItemsIterator, specificItemsIterator);

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
                caffeines.values()
            );

            assert.equal(dimension.id, anyDimensionId);
            assert.deepEqual(dimension.attributes, caffeines);
        });
    });

    it('No attributes', () => {
        const anyDimensionId = 123;
        const f = () => new Dimension(anyDimensionId, [].values());

        assert.throws(f, `expect at least one attribute`);
    });

    ///////////////////////////////////////////////////////////////////////////
    //
    //  Matrix
    //
    ///////////////////////////////////////////////////////////////////////////
    describe('Matrix', () => {
        it('Constructor', () => {
            const anyMatrixId: MID = 123;
            const matrix = new Matrix(anyMatrixId, softServeDimensions, catalog);

            assert.equal(matrix.id, anyMatrixId);
            assert.deepEqual(matrix.dimensions, softServeDimensions);
        });
    });

    it('getKey()', () => {
        const anyMatrixId: MID = 123;
        const matrix = new Matrix(anyMatrixId, softServeDimensions, catalog);

        const info = new AttributeInfo();
        for (const dimension of softServeDimensions) {
            info['addDimension'](dimension);
        }

        const dimensionIdToAttribute = new Map<DID, AID>();
        dimensionIdToAttribute.set(size, sizeMedium);
        dimensionIdToAttribute.set(flavor, flavorVanilla);

        const anyEntityId = 8000;

        // anyEntityId:   8000
        //      medium:   1
        //     vanilla:   0
        //         key:   8000:1:0
        assert.equal(
            matrix.getKey(anyEntityId, dimensionIdToAttribute, info),
            '8000:1:0'
        );
    });

    ///////////////////////////////////////////////////////////////////////////
    //
    //  AttributeInfo
    //
    ///////////////////////////////////////////////////////////////////////////
    describe('AttributeInfo', () => {
        it('addDimension()', () => {
            const info = new AttributeInfo();

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

                // Unknown attribute
                { aid: unknownPID, coordinate: undefined },
            ];

            for (const test of cases) {
                const observed = info.getAttributeCoordinates(test.aid);
                const expected = test.coordinate;
                assert.deepEqual(observed, expected);
            }
        });

        it('addDimension() - exceptions', () => {
            const info = new AttributeInfo();
            info['addDimension'](softServeDimensions[0]);

            // Attempt adding a dimension with the same id.
            const f1 = () => info['addDimension'](softServeDimensions[0]);
            assert.throws(f1, `found duplicate dimension id 0.`);

            // Attempt adding an attribute with a duplicate pid.
            const uniqueId: UID = softServeDimensions[0].id + 1;
            const sizesDimension = new Dimension(uniqueId, sizes.values());
            const f2 = () => info['addDimension'](sizesDimension);
            assert.throws(f2, `found duplicate attribute pid 0.`);
        });

        it('addMatrix()', () => {
            const info = new AttributeInfo();

            const anyMatrixId: MID = 123;
            const matrix = new Matrix(anyMatrixId, softServeDimensions, catalog);

            info['addMatrix'](matrix);

            const f = () => info['addMatrix'](matrix);
            assert.throws(f, 'found duplicate matrix id 123.');
        });

        it('addGenericEntity()', () => {
            const info = new AttributeInfo();

            const softServeMatrixId: MID = 123;
            const softServeMatrix = new Matrix(
                softServeMatrixId,
                softServeDimensions,
                catalog
            );
            info['addMatrix'](softServeMatrix);

            const coffeeMatrixId: MID = 456;
            const coffeeMatrix = new Matrix(coffeeMatrixId, coffeeDimensions, catalog);
            info['addMatrix'](coffeeMatrix);

            // Attempt to reference a non-existant maxtrix.
            const f1 = () => info['addGenericEntity'](1, unknownPID);
            assert.throws(f1, 'unknown matrix id 9999.');

            info['addGenericEntity'](1, softServeMatrixId);

            // Attempt to add a duplicate entity.
            const f2 = () => info['addGenericEntity'](1, unknownPID);
            assert.throws(f2, 'found duplicate entity id 1.');

            info['addGenericEntity'](2, coffeeMatrixId);

            // Lookup entities with ids 1 and 2.
            assert.equal(softServeMatrix, info.getMatrixForEntity(1));
            assert.equal(coffeeMatrix, info.getMatrixForEntity(2));

            // Attempt to lookup non-existant entity.
            const f3 = () => info.getMatrixForEntity(unknownPID);
            assert.throws(f3, 'GenericEntity(pid=9999) has no matrix.');
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    //
    //  MaxtrixEntityBuilder
    //
    ///////////////////////////////////////////////////////////////////////////
    describe('MaxtrixEntityBuilder', () => {
        it('Constructor', () => { });

        it('hasPID()/setPID()', () => {
            const info = new AttributeInfo();
            const builder = new MatrixEntityBuilder(info, catalog);

            // Haven't added an entity yet.
            assert.isFalse(builder.hasPID());

            const pid: PID = 123;
            builder.setPID(pid);

            assert.isTrue(builder.hasPID());

            const f = () => builder.setPID(pid);
            assert.throws(f, 'attempting to overwrite entity 123 with 123');
        });

        it('addAttribute()', () => {
            const info = new AttributeInfo();
            info['addDimension'](softServeDimensions[0]);
            info['addDimension'](softServeDimensions[1]);

            const builder = new MatrixEntityBuilder(info, catalog);

            const f = () =>
                builder.addAttribute(unknownPID);
            assert.throws(f, 'unknown attribute 9999.');

            // First time adding a size should succeed.
            assert.isTrue(builder.addAttribute(sizeSmall));

            // Second size addition should fail.
            assert.isFalse(builder.addAttribute(sizeMedium));

            // First time adding a flavor should succeed.
            assert.isTrue(builder.addAttribute(flavorChocolate));
        });

        it('getKey()', () => {
            const info = new AttributeInfo();
            info['addDimension'](softServeDimensions[0]);
            info['addDimension'](softServeDimensions[1]);

            const softServeMatrixId: MID = 123;
            const softServeMatrix = new Matrix(
                softServeMatrixId,
                softServeDimensions,
                catalog
            );
            info['addMatrix'](softServeMatrix);

            // Configure with a generic ice cream cone item.
            const cone: PID = 8000;
            info['addGenericEntity'](cone, softServeMatrixId);

            // // Configure with a specific `medium vanilla cone`.
            // const mediumVanillaCone = 500;
            // info['addSpecificEntity'](mediumVanillaCone, '8000:1:0');

            // // Configure with a specific `medium chocolate cone`.
            // const mediumChocolateCone = 501;
            // info['addSpecificEntity'](mediumChocolateCone, '8000:1:1');

            // // Configure with a specific `small chocolate cone`.
            // const smallChocolateCone = 502;
            // info['addSpecificEntity'](smallChocolateCone, '8000:0:1');

            const builder = new MatrixEntityBuilder(info, catalog);

            // getKey() before adding entity should throw.
            const f = () => builder.getKey();
            assert.throws(f, 'no pid set');

            // Add a cone entity.
            builder.setPID(cone);

            // All attributes are default.
            assert.equal(builder.getKey(), '8000:0:0');

            // Allow size to default, add flavor=chocolate.
            builder.addAttribute(flavorChocolate);
            assert.equal(builder.getKey(), '8000:0:1');

            // Add size=medium, flavor is still chocolate.
            builder.addAttribute(sizeMedium);
            assert.equal(builder.getKey(), '8000:1:1');
        });
    });
});
