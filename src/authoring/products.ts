import { IIndex, IndexedDimension } from './attributes';
import { InvalidParameterError } from './errors';
import { DID, FormSpec, GroupSpec, Key, TID, WILDCARD } from "./types";

import {
    TensorDescription,
    DimensionDescription
} from "../attributes";

import { GenericTypedEntity, SpecificTypedEntity, MENUITEM } from '../catalog';


// Generate SKUs
// Generate names for specifics

// AttributeInfo constructor
// nameToTensor map and function
// (tensor, dimension index, attribute_name) => position

// enumerate forms: wildcard or named attribute

// for each group
// expand forms
// for each item
// apply template
// expand specifics
//   some solution for overriding generated specifics with hand-authored
//   e.g. to supply custom/non-generated SKU, custom/non-generated name
// update tagToSpecifics

// build rules
// legal child
// mutual exclusion

export class IdGenerator {
    current = 1;
    rounding = 100;

    constructor(start = 1, rounding = 100) {
        this.current = start;
        this.rounding = rounding;
    }

    next() {
        return this.current++;
    }

    gap() {
        this.current = (Math.floor(this.current / this.rounding) + 1) * this.rounding;
    }
}


export function processGroups(
    groups: GroupSpec[],
    tensors: IIndex<TID, TensorDescription>,
    dimensions: IIndex<DID, IndexedDimension>
): Map<string, string[]> {
    const generics: GenericTypedEntity[] = [];
    const specifics: SpecificTypedEntity[] = [];
    const pids = new IdGenerator();
    const skus = new IdGenerator(10000);
    const tagsToKeys = new Map<string, string[]>();
    // let pid = 0;

    for (const g of groups) {
        const tags = g.tags || [];

        // Get tensor or default
        const t = tensors.get(g.tensor || 'none');
        const td = t.dimensions.map(x => dimensions.getById(x).dimension);

        let defaultForm: Key;
        if (g.default) {
            // const d = t.dimensions.map(x => dimensions.getById(x).dimension);
            defaultForm = keyFromAttributes(td, g.default);
        } else {
            defaultForm = t.dimensions.map(x => '0').join(':');
        }

        // const forms = [...generateForms(td, g.forms)];
        const forms = processForms(g.forms, td);

        console.log(`tags: ${tags.join(',')}`);
        console.log(`tensor: ${t.name}`);
        console.log(`defaultKey: ${defaultForm}`);
        // for (const f of forms) {
        //     console.log(`  ${f}`);
        // }
        // Get forms or default
        //   Include/exclude forms

        for (const i of g.items) {
            // Create generic
            const pid = pids.next();
            const defaultKey = [pid, defaultForm].join(':');
            const generic: GenericTypedEntity = {
                kind: MENUITEM,
                name: i.name,
                pid,
                cid: 0,
                aliases: i.aliases,
                tensor: t.tid,
                defaultKey,
            };
            generics.push(generic);

            // Create specifics
            for (const f of forms) {
                const key = generic.pid + ':' + f;
                const specific: SpecificTypedEntity = {
                    kind: MENUITEM,
                    // name: generic.name + '-' + f,
                    name: [
                        ...namePrefixFromForm(td, f),
                        generic.name,
                    ].join(' '),
                    sku: skus.next(),
                    key,
                };
                specifics.push(specific);

                // TODO: index by tag here
                // TODO: ensure all tags are unique
                for (const tag of tags) {
                    const s = tagsToKeys.get(tag);
                    if (s) {
                        s.push(key);
                    } else {
                        tagsToKeys.set(tag, [key]);
                    }
                }
            }
            skus.gap();
            // for each form
                // generate specific
                // generate rule - can't generate rule yet - perhaps want to make tag sets
        }
        pids.gap();

        console.log(JSON.stringify(generics, null, 4));
        console.log(JSON.stringify(specifics, null, 4));
        for (const [k, v] of tagsToKeys.entries()) {
            console.log(`${k}: ${v}`);
        }
    }

    return tagsToKeys;
}

export function processForms(ops: FormSpec[], td: DimensionDescription[]) {
    const forms = new Set<Key>();

    for (const op of ops) {
        if ('include' in op) {
            const include = [...generateForms(td, op.include)];
            for (const f of include) {
                forms.add(f);
            }
        } else {
            const exclude = [...generateForms(td, op.exclude)];
            for (const f of exclude) {
                forms.delete(f);
            }
        }
    }

    return [...forms.values()];
}

export function test(
    tensors: IIndex<TID, TensorDescription>,
    dimensions: IIndex<DID, IndexedDimension>,
    tensorName: string,
    pattern: string[]
) {
    console.log('here');
    const t = tensors.get(tensorName);
    const x = [
        ...generateForms(
            t.dimensions.map(x => dimensions.getById(x).dimension),
            pattern
        ),
    ];
    console.log(x);
}

// function tensorFromName(tensors: IIndex<TensorDescription>,  name: string) {
//     for (const t of tensors) {
//         if (t.name === name) {
//             return t;
//         }
//     }
//     throw new InvalidParameterError(`Unknown tensor ${name}`);
// }

function* generateForms(
    dimensions: DimensionDescription[],
    pattern: string[]
): IterableIterator<string> {
    if (dimensions.length !== pattern.length) {
        const message = `dimensions.length !== pattern.length`;
        throw new InvalidParameterError(message);
    }

    const fields: DID[][] = [];
    for (let i = 0; i < dimensions.length; ++i) {
        if (pattern[i] === WILDCARD) {
            // tslint:disable-next-line:ban
            fields.push([...Array(dimensions[i].attributes.length).keys()]);
            // fields.push(dimensions[i].attributes.map(a => a.aid));
        } else {
            const p = positionFromName(dimensions[i], pattern[i]);
            fields.push([p]);
        }
    }

    // yield* generateCombinations(fields);
    for (const c of generateCombinations(fields)) {
        yield c.join(':');
    }
}

function keyFromAttributes(d: DimensionDescription[], attributes: string[]) {
    if (d.length !== attributes.length) {
        const message = `d.length !== attributes.length`;
        throw new InvalidParameterError(message);
    }

    const k = attributes.map((name, i) => positionFromName(d[i], name));
    return k.join(':');
}

function namePrefixFromForm(d: DimensionDescription[], form: string) {
    // console.log(`namePrefixFromForm ${form}`);
    const parts = form.split(':').map(x => Number(x)); //.slice(1);
    // const names = parts.map((x, i) => d[i].attributes[x].name).join(' ');
    const names: string[] = [];
    for (const [i, part] of parts.entries()) {
        const a = d[i].attributes[part];
        if (!a.hidden) {
            names.push(a.name);
        }
    }
    return names;
}

function positionFromName(d: DimensionDescription, name: string) {
    for (const [i, a] of d.attributes.entries()) {
        if (a.name === name) {
            return i;
        }
    }
    const message = `attribute "${name}" not found on dimension "${d.name}"`;
    throw new InvalidParameterError(message);
}

function* generateCombinations<T>(
    a: T[][],
    index = 0,
    prefix: T[] = []
): IterableIterator<T[]> {
    // console.log(`generateCombinations(${a}, ${index}, ${prefix})`);

    if (index === a.length) {
        // console.log(`yield ${prefix}`);
        yield [...prefix];
    } else {
        for (const x of a[index]) {
            prefix.push(x);
            yield* generateCombinations(a, index + 1, prefix);
            prefix.pop();
        }
    }
}

// function getPosition(t: TensorDescription, index: number, name: string) {
//     if (index < 0 || index >= t.dimensions.length) {
//         const message = `dimension ${index} out of range for tensor ${t.name}`;
//         throw new InvalidParameterError(message);
//     }

//     const did = t.dimensions[index];
    
// }