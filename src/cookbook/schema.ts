import * as AJV from 'ajv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

import { Cookbook } from './cookbook';
import { RecipeList } from './interfaces';

// typescript-json-schema tsconfig.json RecipeList --required
const recipeListSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
        OptionRecipe: {
            properties: {
                aliases: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                name: {
                    type: 'string',
                },
                options: {
                    items: {
                        $ref: '#/definitions/OptionTemplate',
                    },
                    type: 'array',
                },
                rid: {
                    type: 'number',
                },
            },
            required: ['aliases', 'name', 'options', 'rid'],
            type: 'object',
        },
        OptionTemplate: {
            properties: {
                key: {
                    description:
                        "A type alias to keep various concepts delineated.\n\nEach specific product such as `small strawberry milkshake` or `large decaf`\n`iced coffee` will have its own unique Key. The Key is a tensor where the\nfirst dimesnion is a generic product's PID, and any other dimensions\ndetermine which attributes are added.",
                    type: 'string',
                },
                quantity: {
                    type: 'number',
                },
            },
            required: ['key', 'quantity'],
            type: 'object',
        },
        ProductRecipe: {
            properties: {
                aliases: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                name: {
                    type: 'string',
                },
                products: {
                    items: {
                        $ref: '#/definitions/ProductTemplate',
                    },
                    type: 'array',
                },
                rid: {
                    type: 'number',
                },
            },
            required: ['aliases', 'name', 'products', 'rid'],
            type: 'object',
        },
        ProductTemplate: {
            properties: {
                key: {
                    description:
                        "A type alias to keep various concepts delineated.\n\nEach specific product such as `small strawberry milkshake` or `large decaf`\n`iced coffee` will have its own unique Key. The Key is a tensor where the\nfirst dimesnion is a generic product's PID, and any other dimensions\ndetermine which attributes are added.",
                    type: 'string',
                },
                options: {
                    items: {
                        $ref: '#/definitions/OptionTemplate',
                    },
                    type: 'array',
                },
                quantity: {
                    type: 'number',
                },
            },
            required: ['key', 'options', 'quantity'],
            type: 'object',
        },
    },
    properties: {
        options: {
            items: {
                $ref: '#/definitions/OptionRecipe',
            },
            type: 'array',
        },
        products: {
            items: {
                $ref: '#/definitions/ProductRecipe',
            },
            type: 'array',
        },
    },
    required: ['options', 'products'],
    type: 'object',
};

const ajv = new AJV();
const cookbookValidator = ajv.compile(recipeListSchema);

export function cookbookFromYamlFile(infile: string): Cookbook {
    const yamlText = fs.readFileSync(infile, 'utf8');
    const recipes = yaml.safeLoad(yamlText) as RecipeList;
    if (!cookbookValidator(recipes)) {
        const message =
            'cookbookFromYamlFile: yaml data does not conform to schema.';
        console.log(message);
        console.log(cookbookValidator.errors);
        throw TypeError(message);
    }

    return new Cookbook(recipes);
}
