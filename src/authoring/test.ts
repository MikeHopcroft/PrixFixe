import * as yaml from 'js-yaml';
import * as fs from 'fs';

import { DimensionAndTensorDescription } from '../attributes';

import { processDimensions, processTensors} from './attributes';
import { processGroups, GroupBuilder } from './products';
import { processRules } from './rules';

import {
    // AnyGroup,
    AnyRule,
    catalogSpecType,
    DimensionSpec,
    GroupSpec,
    TensorSpec,
    // TensorGroupSpec
} from './types';

import { validate } from './validate';
import { dim } from 'ansi-styles';

export function build(
    ds: DimensionSpec[],
    ts: TensorSpec[],
    gs: GroupSpec[],
    rs: AnyRule[]
): DimensionAndTensorDescription {
    const dimensions = processDimensions(ds);
    const tensors = processTensors(dimensions, ts);

    // test(tensors, dimensions, 'latte_drinks', ['hot', 'small']);
    // test(tensors, dimensions, 'latte_drinks', ['*', '*']);
    const builder = new GroupBuilder(dimensions, tensors);
    const tagsToPIDs = processGroups(builder, gs);

    // const tagsToPIDs = processGroups(gs, tensors, dimensions);
    const rules = processRules(tagsToPIDs, rs);

    return {
        dimensions: [...dimensions.values()].map(d => d.dimension),
        tensors: [...tensors.values()],
    };
}

function go(filename: string) {
    const root = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));

    // console.log(JSON.stringify(root, null, 4));
    // console.log('=====================================');

    const spec = validate(catalogSpecType, root);
    const x = build(spec.dimensions, spec.tensors, spec.catalog, spec.rules);

    // console.log(JSON.stringify(x, null, 4));
}

go('c:\\temp\\catalog.yaml');
console.log('done done done done');

