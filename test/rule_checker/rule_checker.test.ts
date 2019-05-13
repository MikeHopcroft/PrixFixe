import { assert } from 'chai';
import 'mocha';

import { RuleChecker, RuleConfig } from '../../src/rule_checker';

const SAMPLE_RULES: RuleConfig = {
    rules: [
        // For all lattes, we can only add one type of milk
        {
            partialKey: '9000',                // All lattes
            validCatagoryMap: {},              // No option rules to apply
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

//const ruleChecker = new RuleChecker(SAMPLE_RULES);
