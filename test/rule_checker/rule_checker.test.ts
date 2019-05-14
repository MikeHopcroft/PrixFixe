import { assert } from 'chai';
import 'mocha';

import { RuleChecker, RuleConfig } from '../../src/rule_checker';
import { KEY } from '../../src/catalog/interfaces';

const SAMPLE_RULES: RuleConfig = {
    rules: [
        // For all lattes, we can only add one type of milk
        {
            partialKey: '9000',                // All lattes
            validCatagoryMap: {              // No option rules to apply
                '500': {
                    validOptions: [5000],
                    qtyInfo: { defaultQty: 1, minQty: 1, maxQty: 1 },
                },
            },
            exclusionZones: { '500': [5000] }, // Milk is exclusive
        },
        // For hot lattes, we have no valid catagories of options
        { partialKey: '9000:0', validCatagoryMap: {}, exclusionZones: {} },
        // For iced lattes, we may add drizzles as a valid catagory of options
        {
            partialKey: '9000:1',  // Iced lattes
            validCatagoryMap: {
                '700': {                           // Drizzle catagory
                    validOptions: [6000],          // Generic drizzle
                    qtyInfo: { defaultQty: 1, minQty: 0, maxQty: 20 },
                },
            },
            exclusionZones: {},
        },
    ],
};

const latteIcedKey: KEY = '9000:1:0';
const latteHotKey: KEY = '9000:0:2';

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
        it('A drizzle cannot be in a hot latte', () => {
            assert(!ruleChecker.isValidChild(latteHotKey, drizzleKey));
        });

        it('Another drizzle cannot be in a hot latte', () => {
            assert(!ruleChecker.isValidChild(latteHotKey, anotherDrizzleKey));
        });

        it('Sprinkles cannot be in a hot latte', () => {
            assert(!ruleChecker.isValidChild(latteHotKey, sprinklesKey));
        });

        it('More sprinkles cannot be in a hot latte', () => {
            assert(!ruleChecker.isValidChild(latteHotKey, anotherSprinleKey));
        });

        it('A drizzle can be in an iced latte', () => {
            assert(ruleChecker.isValidChild(latteIcedKey, drizzleKey));
        });

        it('Another drizzle can be in an iced latte', () => {
            assert(ruleChecker.isValidChild(latteIcedKey, anotherDrizzleKey));
        });

        it('Sprinkles can be in an iced latte', () => {
            assert(ruleChecker.isValidChild(latteIcedKey, sprinklesKey));
        });

        it('More sprinkles can be in an iced latte', () => {
            assert(ruleChecker.isValidChild(latteIcedKey, anotherSprinleKey));
        });
    });

    describe('Are mutually exclusive', () => {

    });

    describe('Default quantity', () => {

    });

    describe('Within quantity threshold', () => {

    });
});
