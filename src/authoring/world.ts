import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

import { AttributeInfo, DimensionAndTensorDescription } from '../attributes';
import { CartOps } from '../cart';
import { Catalog } from '../catalog';
import { Cookbook } from '../cookbook';
import { World } from '../processors';

import { processDimensions, processTensors} from './attributes';
import { processGroups, GroupBuilder } from './products';
import { processRules } from './rules';
import { catalogSpecType } from './types';
import { validate } from './validate';


export function createWorld2(dataPath: string): World {
    const catalogFile = path.join(dataPath, 'catalog.yaml');

    const root = yaml.safeLoad(fs.readFileSync(catalogFile, 'utf8'));
    const spec = validate(catalogSpecType, root);

    const dimensions = processDimensions(spec.dimensions);
    const tensors = processTensors(dimensions, spec.tensors);
    const attributes: DimensionAndTensorDescription = {
        dimensions: [...dimensions.values()].map(d => d.dimension),
        tensors: [...tensors.values()],
    };

    const builder = new GroupBuilder(dimensions, tensors);
    processGroups(builder, spec.catalog);
    const catalog = Catalog.fromEntities(
        builder.generics.values(),
        builder.specifics.values()
    );

    const attributeInfo = new AttributeInfo(catalog, attributes);

    // TODO: reintroduce Cookbook
    const cookbook = new Cookbook({
        products: [],
        options: [],
    });

    const ruleChecker = processRules(builder.tagsToPIDs, spec.rules);
 
    const cartOps = new CartOps(attributeInfo, catalog, ruleChecker);

    return {
        attributes,
        attributeInfo,
        cartOps,
        catalog,
        cookbook,
        ruleChecker,
    };
}
