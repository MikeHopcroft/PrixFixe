import { assert } from 'chai';
import 'mocha';

import { RuleChecker, RuleConfig } from '../../src/rule_checker';
import { KEY } from '../../src/catalog/interfaces';

const SAMPLE_RULES: RuleConfig = {
    rules: [
        // For all lattes, we can only add one type of milk
        {
            partialKey: '9000', // All lattes
            validCatagoryMap: {
                // No option rules to apply
                '500': {
                    validOptions: [5000],
                    qtyInfo: {
                        '': { defaultQty: 1, minQty: 1, maxQty: 1 },
                    },
                },
            },
            exclusionZones: { '500': [5000] }, // Milk is exclusive
            specificExceptions: [],
        },
        // For hot lattes, we have no valid catagories of options
        {
            partialKey: '9000:0',
            validCatagoryMap: {},
            exclusionZones: {},
            specificExceptions: [],
        },
        // For iced lattes, we may add drizzles as a valid catagory of options
        {
            partialKey: '9000:1', // Iced lattes
            validCatagoryMap: {
                '700': {
                    // Drizzle catagory
                    validOptions: [6000], // Generic drizzle
                    qtyInfo: {
                        // Small iced lattes
                        '0': {
                            defaultQty: 1,
                            minQty: 0,
                            maxQty: 10,
                        },
                        // Medium iced lattes
                        '1': {
                            defaultQty: 3,
                            minQty: 0,
                            maxQty: 15,
                        },
                        // Large iced lattes
                        '2': {
                            defaultQty: 5,
                            minQty: 0,
                            maxQty: 20,
                        },
                    },
                },
            },
            exclusionZones: {},
            specificExceptions: [],
        },
    ],
};

const latteIcedKey: KEY = '9000:1:0';
const latteHotKey: KEY = '9000:0:2';

const smallIced: KEY = '9000:1:0';
const mediumIced: KEY = '9000:1:1';
const largeIced: KEY = '9000:1:2';

const drizzleKey: KEY = '6000:1:0';
const anotherDrizzleKey: KEY = '6000:1:2';
const sprinklesKey: KEY = '7000:2';
const anotherSprinleKey: KEY = '7000:1';

const soyMilkKey: KEY = '5000:3';
const twoMilkKey: KEY = '5000:1';
const wholeMilkKey: KEY = '5000:0';

const ruleChecker = new RuleChecker(SAMPLE_RULES);

describe('RuleChecker', () => {
    describe('Is valid child', () => {
        it('Invalid children evaluate to false', () => {
            // Drizzles cannot be in hot lattes
            assert.isFalse(ruleChecker.isValidChild(latteHotKey, drizzleKey));
            // Another drizzle cannot be in a hot latte
            assert.isFalse(
                ruleChecker.isValidChild(latteHotKey, anotherDrizzleKey)
            );
            // Sprinkles cannot be in lattes
            assert.isFalse(ruleChecker.isValidChild(latteHotKey, sprinklesKey));
            // More sprinkles also don't belong in lattes
            assert.isFalse(
                ruleChecker.isValidChild(latteHotKey, anotherSprinleKey)
            );

            // Sprinkles cannot be in an iced latte
            assert.isTrue(ruleChecker.isValidChild(latteIcedKey, sprinklesKey));
            // More sprinkles cannot be in an iced latte
            assert.isTrue(
                ruleChecker.isValidChild(latteIcedKey, anotherSprinleKey)
            );
        });

        it('Valid children evaluate to true', () => {
            // A drizzle can be in an iced latte
            assert.isTrue(ruleChecker.isValidChild(latteIcedKey, drizzleKey));
            // More drizzles can be in iced lattes
            assert.isTrue(
                ruleChecker.isValidChild(latteIcedKey, anotherDrizzleKey)
            );
        });

        // TODO: Add test for specificException
    });

    describe('Are mutually exclusive', () => {
        const failSet: IterableIterator<KEY> = [
            soyMilkKey,
            twoMilkKey,
            wholeMilkKey,
        ].values();

        it('Cannot have three items from a mutually exclusive set.', () => {
            assert.isFalse(
                ruleChecker.isMutuallyExclusive('latteHotKey', failSet)
            );
        });

        const failSetTwo: IterableIterator<KEY> = [
            soyMilkKey,
            twoMilkKey,
        ].values();

        const failSetThree: IterableIterator<KEY> = [
            soyMilkKey,
            wholeMilkKey,
        ].values();

        const failSetFour: IterableIterator<KEY> = [
            twoMilkKey,
            wholeMilkKey,
        ].values();

        it('Cannot have two items from a mutually exclusive set.', () => {
            assert.isFalse(
                ruleChecker.isMutuallyExclusive(latteHotKey, failSetTwo)
            );
            assert.isFalse(
                ruleChecker.isMutuallyExclusive(latteHotKey, failSetThree)
            );
            assert.isFalse(
                ruleChecker.isMutuallyExclusive(latteHotKey, failSetFour)
            );

            assert.isFalse(
                ruleChecker.isMutuallyExclusive(latteIcedKey, failSetTwo)
            );
            assert.isFalse(
                ruleChecker.isMutuallyExclusive(latteIcedKey, failSetThree)
            );
            assert.isFalse(
                ruleChecker.isMutuallyExclusive(latteIcedKey, failSetFour)
            );
        });

        const successSet: IterableIterator<KEY> = [soyMilkKey].values();

        const successSetTwo: IterableIterator<KEY> = [twoMilkKey].values();

        const successSetThree: IterableIterator<KEY> = [wholeMilkKey].values();

        it('Individual items can exist by themselves', () => {
            assert.isTrue(
                ruleChecker.isMutuallyExclusive(latteHotKey, successSet)
            );
            assert.isTrue(
                ruleChecker.isMutuallyExclusive(latteHotKey, successSetTwo)
            );
            assert.isTrue(
                ruleChecker.isMutuallyExclusive(latteHotKey, successSetThree)
            );
        });

        // TODO: Add test for items that belong to different exclusion zones
    });

    describe('Default quantity', () => {
        it('Fetches the correct default quantity for top level rules', () => {
            // Milks should all be one
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(latteHotKey, wholeMilkKey),
                1
            );
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(latteHotKey, twoMilkKey),
                1
            );
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(latteHotKey, soyMilkKey),
                1
            );
        });

        it('Fetches correct default quantity for mid level rules', () => {
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(smallIced, drizzleKey),
                1
            );
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(mediumIced, drizzleKey),
                3
            );
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(largeIced, drizzleKey),
                5
            );

            assert.deepEqual(
                ruleChecker.getDefaultQuantity(smallIced, anotherDrizzleKey),
                1
            );
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(mediumIced, anotherDrizzleKey),
                3
            );
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(largeIced, anotherDrizzleKey),
                5
            );
        });

        it('Returns `-1` for invalid options', () => {
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(latteHotKey, drizzleKey),
                -1
            );
            assert.deepEqual(
                ruleChecker.getDefaultQuantity(latteHotKey, anotherDrizzleKey),
                -1
            );
        });
    });

    describe('Within quantity threshold', () => {
        it('Valid within bounds', () => {
            assert.isTrue(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 2)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 5)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 9)
            );

            assert.isTrue(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 2)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 7)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 14)
            );

            assert.isTrue(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 2)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 8)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 19)
            );
        });

        it('Valid on edge of bounds', () => {
            assert.isTrue(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 0)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 1)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 10)
            );

            assert.isTrue(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 0)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 1)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 15)
            );

            assert.isTrue(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 0)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 1)
            );
            assert.isTrue(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 20)
            );
        });

        it('Invalid outside of bounds', () => {
            assert.isFalse(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, -3)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, -1)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 11)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(smallIced, drizzleKey, 47)
            );

            assert.isFalse(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, -7)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, -1)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 16)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(mediumIced, drizzleKey, 56)
            );

            assert.isFalse(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, -5)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, -1)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 21)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(largeIced, drizzleKey, 84)
            );
        });

        it('Invalid items return false', () => {
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 2)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 5)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 9)
            );

            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 0)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 1)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 10)
            );

            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, -3)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, -1)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 11)
            );
            assert.isFalse(
                ruleChecker.isValidQuantity(latteHotKey, drizzleKey, 47)
            );
        });
    });
});
