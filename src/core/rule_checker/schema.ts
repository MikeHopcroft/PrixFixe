import * as AJV from 'ajv';
import * as YAML from 'js-yaml';

import { RuleConfig } from './interfaces';
import { YAMLValidationError } from '../utilities';

// generated with:
// typescript-json-schema tsconfig.json RuleConfig --required
const ruleConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    CategoryInfo: {
      properties: {
        qtyInfo: {
          $ref: '#/definitions/DownstreamQuantity',
        },
        validOptions: {
          items: {
            type: 'number',
          },
          type: 'array',
        },
      },
      required: ['qtyInfo', 'validOptions'],
      type: 'object',
    },
    DownstreamQuantity: {
      additionalProperties: {
        $ref: '#/definitions/QuantityInformation',
      },
      type: 'object',
    },
    PartialRule: {
      properties: {
        exclusionZones: {
          additionalProperties: false,
          patternProperties: {
            '^[0-9]+$': {
              items: {
                type: 'number',
              },
              type: 'array',
            },
          },
          type: 'object',
        },
        partialKey: {
          description:
            "A type alias to keep various concepts delineated.\n\nEach specific product such as `small strawberry milkshake` or `large decaf`\n`iced coffee` will have its own unique Key. The Key is a tensor where the\nfirst dimesnion is a generic product's PID, and any other dimensions\ndetermine which attributes are added.",
          type: 'string',
        },
        specificExceptions: {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        validCategoryMap: {
          additionalProperties: false,
          patternProperties: {
            '^[0-9]+$': {
              $ref: '#/definitions/CategoryInfo',
            },
          },
          type: 'object',
        },
      },
      required: [
        'exclusionZones',
        'partialKey',
        'specificExceptions',
        'validCategoryMap',
      ],
      type: 'object',
    },
    QuantityInformation: {
      properties: {
        defaultQty: {
          type: 'number',
        },
        maxQty: {
          type: 'number',
        },
        minQty: {
          type: 'number',
        },
      },
      required: ['defaultQty', 'maxQty', 'minQty'],
      type: 'object',
    },
  },
  description: 'The shape of the `rule.yaml` file.',
  properties: {
    rules: {
      items: {
        $ref: '#/definitions/PartialRule',
      },
      type: 'array',
    },
  },
  required: ['rules'],
  type: 'object',
};

const ajv = new AJV();
const ruleConfigValidator = ajv.compile(ruleConfigSchema);

export const validateRuleConfig = (ruleConfig: RuleConfig) => {
  if (!ruleConfigValidator(ruleConfig)) {
    const message = 'validateRuleConfig: Invalid `rules.yaml` config file.';
    console.error(message);
    console.error(ruleConfigValidator.errors);
    throw new YAMLValidationError(message, []);
    // const output = betterAjvErrors(
    //   ruleConfigSchema,
    //   ruleConfig,
    //   ruleConfigValidator.errors,
    //   { format: 'cli', indent: 1 }
    // );
    // throw new YAMLValidationError(message, output || []);
  }
};

////////////////////////////////
// Temp function, this will likely land elsewhere
////////////////////////////////
export function loadRuleConfig(yamlText: string): RuleConfig {
  const yamlRoot = YAML.safeLoad(yamlText) as RuleConfig;

  validateRuleConfig(yamlRoot);

  return yamlRoot;
}
