import { IIndex, IndexedDimension } from './attributes';
import { PID } from '../catalog';
import { InvalidParameterError } from './errors';
import {
    // AnyGroup,
    DID,
    FormSpec,
    GroupSpec,
    // TensorGroupSpec,
    Key,
    TID,
    WILDCARD,
    ItemSpec
} from "./types";

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



class Context {
    tensor: TensorDescription;
    dimensions: DimensionDescription[];
    forms = new Set<Key>();
    defaultForm: string;
    tags = new Set<string>();

    constructor(
        builder: GroupBuilder,
        tensor?: string,
        forms?: FormSpec[],
        defaultForm?: string[]
    ) {
        this.tensor = builder.tensors.get(tensor || 'none');
        this.dimensions = this.tensor.dimensions.map(
            x => builder.dimensions.getById(x).dimension
        );

        const f = forms || [{ include: this.tensor.dimensions.map(x => '*') }];
        this.mergeForms(f, this.dimensions);

        this.defaultForm = defaultForm ?
            keyFromAttributes(this.dimensions, defaultForm) :
            this.dimensions.map(x => '0').join(':');

        this.verifyDefaultForm();
    }

    extend(
        builder: GroupBuilder,
        tensor?: string,
        forms?: FormSpec[],
        defaultForm?: string[],
        tags?: string[]
    ): Context {
        let context: Context;

        if (tensor === undefined) {
            // Tensor remains the same, so just copy over the current context.
            context = { ...this};

            // Modify the forms to generate, if specified.
            if (forms !== undefined) {
                context.forms = new Set<string>(context.forms);
                context.mergeForms(forms, this.dimensions);
            }

            // Modify the default form, if specified.
            if (defaultForm !== undefined) {
                context.defaultForm = keyFromAttributes(this.dimensions, defaultForm);
            }

            // Verify that the default form is one of the generated forms.
            context.verifyDefaultForm();
        } else {
            // We're specifying a new tensor, so just construct a new context.
            context = new Context(
                builder,
                tensor,
                forms,
                defaultForm
            );
        }

        // Merge in any tags that were specified.
        if (tags !== undefined) {
            context.tags = new Set<string>(this.tags);
            for (const tag of tags) {
                context.tags.add(tag);
            }
        }

        return context;
    }

    private mergeForms(ops: FormSpec[], td: DimensionDescription[]): void {
        for (const op of ops) {
            if ('include' in op) {
                const include = [...generateForms(td, op.include)];
                for (const f of include) {
                    this.forms.add(f);
                }
            } else {
                const exclude = [...generateForms(td, op.exclude)];
                for (const f of exclude) {
                    this.forms.delete(f);
                }
            }
        }
    }
    
            // if (tensor !== undefined) {
        //     this.tensor = builder.tensors.get(tensor || 'none');
        //     this.dimensions = this.tensor.dimensions.map(
        //         x => builder.dimensions.getById(x).dimension
        //     );

        //     const f = forms || [{ include: this.tensor.dimensions.map(x => '*') }];
        //     this.forms = processForms(f, this.dimensions);
        //     // this.forms = forms || this.tensor.dimensions.map( x => '*' );

        //     this.defaultForm = defaultForm ?
        //         keyFromAttributes(this.dimensions, defaultForm) :
        //         this.dimensions.map(x => '0').join(':');
        // } else {
        //     if (forms !== undefined) {
        //         const f = forms || [{ include: this.tensor.dimensions.map(x => '*') }];
        //         this.forms = processForms(f, this.dimensions);
        //     }
            
        //     if (defaultForm !== undefined) {
        //         this.defaultForm = keyFromAttributes(this.dimensions, defaultForm);
        //     }
        // }


    // copy() {
    //     return { ...this };
    // }

    // changeForms(forms: string[]) {
    //     this.forms = processForms(g.forms, this.dimensions);
    // }

    // changeDefaultForm(defaultForm: string[]) {
    //     this.defaultForm = keyFromAttributes(this.dimensions, defaultForm);
    // }

    private verifyDefaultForm() {
        if (!this.forms.has(this.defaultForm)) {
            const message = `Default form ${this.defaultForm} not in set of generated forms`;
        }
    }
}


// function createTensorContext(
//     builder: GroupBuilder,
//     name: string,
//     formsOverride?: string[],
//     defaultFormOverride?: string[]
// ): TensorContext {
//     const tensor = builder.tensors.get(name);
//     const dimensions = tensor.dimensions.map(
//         x => builder.dimensions.getById(x).dimension
//     );
//     const forms = formsOverride || tensor.dimensions.map( x => '*' );

//     const defaultForm = defaultFormOverride ?
//         keyFromAttributes(dimensions, defaultFormOverride) :
//         dimensions.map(x => '0').join(':');

//     return { tensor, dimensions, forms, defaultForm };
// }

export class GroupBuilder {
    readonly generics: GenericTypedEntity[] = [];
    readonly specifics: SpecificTypedEntity[] = [];
    readonly pids = new IdGenerator();
    readonly skus = new IdGenerator(10000);
    readonly tagsToPIDs = new Map<string, PID[]>();

    readonly tensors: IIndex<TID, TensorDescription>;
    readonly dimensions: IIndex<DID, IndexedDimension>;

    readonly context: Context[];

    constructor(
        dimensions: IIndex<DID, IndexedDimension>,
        tensors: IIndex<TID, TensorDescription>
    ) {
        this.dimensions = dimensions;
        this.tensors = tensors;

        // WARNING: createTensorContext() relies on this.tensors and
        // this.dimensions.
        this.context = [new Context(this, 'none')];
    }

    getContext(): Context {
        return this.context[this.context.length - 1];
    }

    push(
        tensor?: string,
        forms?: FormSpec[],
        defaultForm?: string[],
        tags?: string[]
    ) {
        const c = this.getContext().extend(
            this,
            tensor,
            forms,
            defaultForm,
            tags
        );
        this.context.push(c);
    }

    pop() {
        if (this.context.length === 1) {
            const message = 'Context stack underflow';
            throw new InvalidParameterError(message);
        }
        this.context.pop();
    }
}

export function processGroups(
    builder: GroupBuilder,
    groups: GroupSpec[]
    // tensors: IIndex<TID, TensorDescription>,
    // dimensions: IIndex<DID, IndexedDimension>
): Map<string, PID[]> {
    // const generics: GenericTypedEntity[] = [];
    // const specifics: SpecificTypedEntity[] = [];
    // const pids = new IdGenerator();
    // const skus = new IdGenerator(10000);
    // const tagsToPIDs = new Map<string, PID[]>();
    const generics = builder.generics;
    const specifics = builder.specifics;
    const pids = builder.pids;
    // const skus = builder.skus;
    const tagsToPIDs = builder.tagsToPIDs;
    // const tensors = builder.tensors;
    // const dimensions = builder.dimensions;
    // const context = builder.getContext();

    for (const g of groups) {
        builder.push(g.tensor, g.forms, g.default, g.tags);
        for (const item of g.items) {
            if ('items' in item) {
                break;
            } else {
                processItem(builder, item);
            }
        }
        builder.pop();
    }
    pids.gap();

    console.log(JSON.stringify(generics, null, 4));
    console.log(JSON.stringify(specifics, null, 4));
    for (const [k, v] of tagsToPIDs.entries()) {
        console.log(`${k}: ${v}`);
    }
    return tagsToPIDs;
}



    // // if ('members' in g) {
        // //     break;
        // // }
        // const tags = g.tags || [];

        // // Get tensor or default
        // const t = tensors.get(g.tensor || 'none');
        // const td = t.dimensions.map(x => dimensions.getById(x).dimension);

        // let defaultForm: Key;
        // if (g.default) {
        //     // const d = t.dimensions.map(x => dimensions.getById(x).dimension);
        //     defaultForm = keyFromAttributes(td, g.default);
        // } else {
        //     defaultForm = t.dimensions.map(x => '0').join(':');
        // }

        // // const forms = [...generateForms(td, g.forms)];
        // const forms = processForms(g.forms, context.dimensions);

        // console.log(`tags: ${tags.join(',')}`);
        // console.log(`tensor: ${t.name}`);
        // console.log(`defaultKey: ${defaultForm}`);
        // // for (const f of forms) {
        // //     console.log(`  ${f}`);
        // // }
        // // Get forms or default
        // //   Include/exclude forms

        // for (const i of g.items) {
        //     if ('items' in i) {
        //         break;
        //     } else {
        //         processItem(builder, tags, t, forms, defaultForm, i);
        //     }
            // // Create generic
            // const pid = pids.next();
            // const defaultKey = [pid, defaultForm].join(':');
            // const generic: GenericTypedEntity = {
            //     kind: MENUITEM,
            //     name: i.name,
            //     pid,
            //     cid: 0,
            //     aliases: i.aliases,
            //     tensor: t.tid,
            //     defaultKey,
            // };
            // generics.push(generic);

            // // TODO: index by tag here
            // // TODO: ensure all tags are unique
            // for (const tag of tags) {
            //     const s = tagsToPIDs.get(tag);
            //     if (s) {
            //         s.push(pid);
            //     } else {
            //         tagsToPIDs.set(tag, [pid]);
            //     }
            // }

            // // Create specifics
            // for (const f of forms) {
            //     const key = generic.pid + ':' + f;
            //     const specific: SpecificTypedEntity = {
            //         kind: MENUITEM,
            //         // name: generic.name + '-' + f,
            //         name: [
            //             ...namePrefixFromForm(td, f),
            //             generic.name,
            //         ].join(' '),
            //         sku: skus.next(),
            //         key,
            //     };
            //     specifics.push(specific);

            //     // // TODO: index by tag here
            //     // // TODO: ensure all tags are unique
            //     // for (const tag of tags) {
            //     //     const s = tagsToPIDs.get(tag);
            //     //     if (s) {
            //     //         s.push(key);
            //     //     } else {
            //     //         tagsToPIDs.set(tag, [key]);
            //     //     }
            //     // }
            // }
            // skus.gap();
            // for each form
            // generate specific
            // generate rule - can't generate rule yet - perhaps want to make tag sets
        // }
//         pids.gap();

//         console.log(JSON.stringify(generics, null, 4));
//         console.log(JSON.stringify(specifics, null, 4));
//         for (const [k, v] of tagsToPIDs.entries()) {
//             console.log(`${k}: ${v}`);
//         }
//     }

//     return tagsToPIDs;
// }

function processItem(
    builder: GroupBuilder,
    // tags: string[],
    // tensor: TensorDescription,
    // forms: string[],
    // defaultForm: string,
    item: ItemSpec
) {
    const generics = builder.generics;
    const specifics = builder.specifics;
    const pids = builder.pids;
    const skus = builder.skus;
    const tagsToPIDs = builder.tagsToPIDs;
    // const tensors = builder.tensors;
    // const dimensions = builder.dimensions;
    const context = builder.getContext();

    // Create generic
    const pid = pids.next();
    const defaultKey = [pid, context.defaultForm].join(':');
    const generic: GenericTypedEntity = {
        kind: MENUITEM,
        name: item.name,
        pid,
        cid: 0,
        aliases: item.aliases,
        tensor: context.tensor.tid,
        defaultKey,
    };
    generics.push(generic);

    // TODO: index by tag here
    // TODO: ensure all tags are unique
    for (const tag of context.tags) {
        const s = tagsToPIDs.get(tag);
        if (s) {
            s.push(pid);
        } else {
            tagsToPIDs.set(tag, [pid]);
        }
    }

    // Create specifics
    for (const f of context.forms) {
        const key = generic.pid + ':' + f;
        const specific: SpecificTypedEntity = {
            kind: MENUITEM,
            // name: generic.name + '-' + f,
            name: [
                ...namePrefixFromForm(context.dimensions, f),
                generic.name,
            ].join(' '),
            sku: skus.next(),
            key,
        };
        specifics.push(specific);

        // // TODO: index by tag here
        // // TODO: ensure all tags are unique
        // for (const tag of tags) {
        //     const s = tagsToPIDs.get(tag);
        //     if (s) {
        //         s.push(key);
        //     } else {
        //         tagsToPIDs.set(tag, [key]);
        //     }
        // }
    }
    skus.gap();
}

// export function processForms(ops: FormSpec[], td: DimensionDescription[]): Set<Key> {
//     const forms = new Set<Key>();

//     for (const op of ops) {
//         if ('include' in op) {
//             const include = [...generateForms(td, op.include)];
//             for (const f of include) {
//                 forms.add(f);
//             }
//         } else {
//             const exclude = [...generateForms(td, op.exclude)];
//             for (const f of exclude) {
//                 forms.delete(f);
//             }
//         }
//     }

//     // return [...forms.values()];
//     return forms;
// }

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