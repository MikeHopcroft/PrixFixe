import * as AJV from 'ajv';
import * as Debug from 'debug';
import * as yaml from 'js-yaml';

import { Attributes, AttributeItem } from './interfaces';

const debug = Debug('so:itemMapFromYamlString');

// Schema generated with typescript-json-schema:
//   typescript-json-schema tsconfig.json Attributes --required
const attributeSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
        AttributeItem: {
            properties: {
                aid: {
                    type: 'number',
                },
                aliases: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                hidden: {
                    type: 'boolean',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['aid', 'aliases', 'name'],
            type: 'object',
        },
        DimensionDescription: {
            properties: {
                did: {
                    type: 'number',
                },
                items: {
                    items: {
                        $ref: '#/definitions/AttributeItem',
                    },
                    type: 'array',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['did', 'items', 'name'],
            type: 'object',
        },
        TensorDescription: {
            properties: {
                dimensions: {
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
                tid: {
                    type: 'number',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['dimensions', 'tid', 'name'],
            type: 'object',
        },
    },
    properties: {
        dimensions: {
            items: {
                $ref: '#/definitions/DimensionDescription',
            },
            type: 'array',
        },
        tensors: {
            items: {
                $ref: '#/definitions/TensorDescription',
            },
            type: 'array',
        },
    },
    required: ['dimensions', 'tensors'],
    type: 'object',
};

const ajv = new AJV();
const attributesValidator = ajv.compile(attributeSchema);

export function* itemsFromAttributes(
    attributes: Attributes
): IterableIterator<AttributeItem> {
    for (const dimension of attributes.dimensions) {
        for (const item of dimension.items) {
            yield item;
        }
    }
}

export function attributesFromYamlString(yamlText: string) {
    const yamlRoot = yaml.safeLoad(yamlText) as Attributes;

    if (!attributesValidator(yamlRoot)) {
        const message =
            'attributesFromYamlString: yaml data does not conform to schema.';
        debug(message);
        debug(attributesValidator.errors);
        throw TypeError(message);
    }

    return yamlRoot;
}
