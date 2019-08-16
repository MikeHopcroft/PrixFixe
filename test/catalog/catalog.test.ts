import { assert, expect } from 'chai';
import 'mocha';

import { Catalog, GenericTypedEntity, SpecificTypedEntity } from '../../src';

import {
    genericConePID,
    genericCoffeePID,
    genericCone,
    genericCoffee,
    genericMilk,
    mediumCoffee,
    smallChocolateCone,
    smallVanillaCone,
    zeroMilk,
    unknownPID,
    unknownKey,
} from '../shared';

const genericItems: GenericTypedEntity[] = [genericCone];

const specificItems: SpecificTypedEntity[] = [smallVanillaCone];

const emptyGenericItems: GenericTypedEntity[] = [];

const emptySpecificItems: SpecificTypedEntity[] = [];

const testCatalog = Catalog.fromEntities(
    genericItems.values(),
    specificItems.values()
);

const emptyCatalog = Catalog.fromEntities(
    emptyGenericItems.values(),
    emptySpecificItems.values()
);

describe('Catalog', () => {
    describe('merge', () => {
        it('should be able to merge a catalog into an empty catalog', () => {
            const catalog = Catalog.fromCatalog(emptyCatalog);
            catalog.merge(testCatalog);
            assert.deepEqual(catalog, testCatalog);
        });

        it('should be able to merge catalog into a full catalog', () => {
            const testGeneric: GenericTypedEntity[] = [genericCoffee];
            const testSpecific: SpecificTypedEntity[] = [
                smallChocolateCone,
                mediumCoffee,
                zeroMilk,
            ];
            const catalog = Catalog.fromEntities(
                testGeneric.values(),
                testSpecific.values()
            );

            // Expected catalog items when we merge catalog with testCatalog
            const expectedGeneric: GenericTypedEntity[] = [
                genericCoffee,
                genericCone,
            ];
            const expectedSpecific: SpecificTypedEntity[] = [
                smallChocolateCone,
                mediumCoffee,
                zeroMilk,
                smallVanillaCone,
            ];
            const expectedCatalog = Catalog.fromEntities(
                expectedGeneric.values(),
                expectedSpecific.values()
            );

            catalog.merge(testCatalog);
            assert.deepEqual(catalog, expectedCatalog);
        });

        it('should throw an exception if there is a duplicate item key', () => {
            const testGeneric: GenericTypedEntity[] = [genericCoffee];
            const testSpecific: SpecificTypedEntity[] = [
                smallChocolateCone,
                smallVanillaCone,
                mediumCoffee,
                zeroMilk,
            ];
            const catalog = Catalog.fromEntities(
                testGeneric.values(),
                testSpecific.values()
            );

            expect(() => catalog.merge(testCatalog)).to.throw(TypeError);
        });
    });

    describe('hasPID', () => {
        it('should return true if PID is found ', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            assert.isTrue(catalog.hasPID(genericConePID));
        });
        it('should return false if PID is not found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            assert.isFalse(catalog.hasPID(unknownPID));
        });
    });

    describe('getGeneric', () => {
        it('should return a GenericTypedEntity if PID is found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            assert.equal(genericCone, catalog.getGeneric(genericConePID));
        });
        it('should throw a TypeError if PID is not found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            expect(() => catalog.getGeneric(unknownPID)).to.throw(TypeError);
        });
    });

    describe('getGenericForKey', () => {
        it('should return GenericTypedEntity if key is found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            assert.equal(
                genericCone,
                catalog.getGenericForKey(genericCone.defaultKey)
            );
        });
        it('should throw a TypeError if key is not found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            expect(() => catalog.getGenericForKey(unknownKey)).to.throw(
                TypeError
            );
        });
    });

    describe('getGenericMap', () => {
        it('should return map of PID and generic entities item in a catalog', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            for (const map of catalog.getGenericMap()) {
                assert.deepEqual([genericConePID, genericCone], map);
            }
        });
    });

    describe('genericEntities', () => {
        it('should return IterableIterator of generics in a catalog', () => {
            // testCatalog contains products from the genericItems array
            const catalog = Catalog.fromCatalog(testCatalog);
            const entities = catalog.genericEntities();
            let entityCount = 0;

            // This test is asserting that the entities returned from the genericEntities()
            // function match what we have in our testCatalog. We are asserting that there is
            // only 1 entity, as we know that testCatalog only contains one generic entity.
            // And we are testing that the entities we find match the items we used to build the
            // testCatalog (which comes from genericItems)
            for (const item of Object.values(genericItems)) {
                assert.equal(item, entities.next().value);
                entityCount++;
            }
            assert.equal(entityCount, 1);
        });
    });

    describe('hasKey', () => {
        it('should return a true if key is found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            assert.isTrue(catalog.hasKey(genericCone.defaultKey));
        });
        it('should return false if key is not found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            assert.isFalse(catalog.hasKey(unknownKey));
        });
    });

    describe('getSpecific', () => {
        it('should return SpecificTypedEntity if key is found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            assert.equal(
                smallVanillaCone,
                catalog.getSpecific(genericCone.defaultKey)
            );
        });
        it('should throw a TypeError if key is not found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            expect(() => catalog.getSpecific(unknownKey)).to.throw(TypeError);
        });
    });

    describe('getSpecificsForGeneric', () => {
        it('should return IterableIterator of keys for generic item if PID is found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            for (const key of catalog.getSpecificsForGeneric(genericConePID)) {
                assert.equal(smallVanillaCone.key, key);
            }
        });
        it('should throw a TypeError if PID is not found', () => {
            const catalog = Catalog.fromCatalog(testCatalog);
            expect(() => catalog.getSpecificsForGeneric(unknownPID)).to.throw(
                TypeError
            );
        });
    });

    describe('specificEntities', () => {
        it('should return IterableIterator of specifics in a catalog', () => {
            // testCatalog contains products from the specificItems array
            const catalog = Catalog.fromCatalog(testCatalog);
            const entities = catalog.specificEntities();
            let entityCount = 0;

            // This test is asserting that the entities returned from the specificEntities()
            // function match what we have in our testCatalog. We are asserting that there is
            // only 1 entity, as we know that testCatalog only contains one specific entity.
            // And we are testing that the entities we find match the items we used to build the
            // testCatalog (which comes from specificItems)
            for (const item of Object.values(specificItems)) {
                assert.equal(item, entities.next().value);
                entityCount++;
            }
            assert.equal(entityCount, 1);
        });
    });
});
