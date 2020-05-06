import * as yaml from 'js-yaml';
import * as fs from 'fs';

import { DimensionAndTensorDescription } from '../attributes';

import { processDimensions, processTensors} from './attributes';
import { processGroups, GroupBuilder } from './products';
import { processRules } from './rules';

import {
    AnyRule,
    catalogSpecType,
    DimensionSpec,
    GroupSpec,
    TensorSpec,
} from './types';

import { validate } from './validate';

export function build(
    ds: DimensionSpec[],
    ts: TensorSpec[],
    gs: GroupSpec[],
    rs: AnyRule[]
): DimensionAndTensorDescription {
    const dimensions = processDimensions(ds);
    const tensors = processTensors(dimensions, ts);

    const builder = new GroupBuilder(dimensions, tensors);
    const tagsToPIDs = processGroups(builder, gs);

    const rules = processRules(tagsToPIDs, rs);

    return {
        dimensions: [...dimensions.values()].map(d => d.dimension),
        tensors: [...tensors.values()],
    };
}

function go(filename: string) {
    const root = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
    const spec = validate(catalogSpecType, root);

    const x = build(spec.dimensions, spec.tensors, spec.catalog, spec.rules);

    // console.log(JSON.stringify(x, null, 4));
}

go('c:\\temp\\catalog.yaml');
console.log('done done done done');

