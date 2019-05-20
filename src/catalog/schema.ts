import * as AJV from 'ajv';
import * as Debug from 'debug';
import * as yaml from 'js-yaml';

import { Catalog } from './catalog';
import { 
    GenericEntity,
    genericEntityFactory,
    GenericTypedEntity,
    SpecificEntity,
    specificEntityFactory,
    SpecificTypedEntity
} from './interfaces';

const debug = Debug('pf:catalogFromYamlString');

// TODO: create `CatalogItems` interface in './interfaces.ts' for loading YAML
// TODO: generate schema with AJV, to validate YAML

interface CatalogDescription {
    genericItems: GenericEntity[];
    specificItems: SpecificEntity[]; 
}

// Schema generated with typescript-json-schema:
//   typescript-json-schema tsconfig.json CatalogDescription --required
const catalogSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "GenericEntity": {
            "properties": {
                "aliases": {
                    "items": {
                        "type": "string",
                    },
                    "type": "array",
                },
                "cid": {
                    "type": "number",
                },
                "defaultKey": {
                    "type": "string",
                },
                "matrix": {
                    "type": "number",
                },
                "name": {
                    "type": "string",
                },
                "pid": {
                    "type": "number",
                },
            },
            "required": [
                "aliases",
                "cid",
                "defaultKey",
                "matrix",
                "name",
                "pid",
            ],
            "type": "object",
        },
        "SpecificEntity": {
            "properties": {
                "key": {
                    "type": "string",
                },
                "name": {
                    "type": "string",
                },
                "sku": {
                    "type": "number",
                },
            },
            "required": [
                "key",
                "name",
                "sku",
            ],
            "type": "object",
        },
    },
    "properties": {
        "genericItems": {
            "items": {
                "$ref": "#/definitions/GenericEntity",
            },
            "type": "array",
        },
        "specificItems": {
            "items": {
                "$ref": "#/definitions/SpecificEntity",
            },
            "type": "array",
        },
    },
    "required": [
        "genericItems",
        "specificItems",
    ],
    "type": "object",
};


const ajv = new AJV();
const catalogValidator = ajv.compile(catalogSchema);

export function catalogFromYamlString(yamlText: string, kind: symbol) {
    const yamlRoot = yaml.safeLoad(yamlText) as CatalogDescription;

    if (!catalogValidator(yamlRoot)) {
        const message =
            'catalogFromYamlString: yaml data does not conform to schema.';
        debug(message);
        debug(catalogValidator.errors);
        throw TypeError(message);
    }

    const f1 = (entity: GenericEntity): GenericTypedEntity => {
        return genericEntityFactory(entity, kind);
    };
    const genericItems = yamlRoot.genericItems.map(f1);

    const f2 = (entity: SpecificEntity): SpecificTypedEntity => {
        return specificEntityFactory(entity, kind);
    };
    const specificItems = yamlRoot.specificItems.map(f2);

    return new Catalog(genericItems.values(), specificItems.values());
}
