import {
    TensorDescription,
    DimensionDescription
} from "../attributes";

import { GenericTypedEntity, SpecificTypedEntity, MENUITEM } from '../catalog';

import { IIndex, IndexedDimension } from './attributes';
import { PID } from '../catalog';
import { InvalidParameterError } from './errors';

import {
    DID,
    FormSpec,
    GroupSpec,
    Key,
    TID,
    WILDCARD,
    ItemSpec
} from "./types";

import { IdGenerator } from './utilities';


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
            context = Object.create(this);

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

    private verifyDefaultForm() {
        if (!this.forms.has(this.defaultForm)) {
            const message = `Default form ${this.defaultForm} not in set of generated forms`;
        }
    }
}

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

    push(group: GroupSpec) {
        const c = this.getContext().extend(
            this,
            group.tensor,
            group.forms,
            group.default,
            group.tags
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
    groups: Array<GroupSpec | ItemSpec>
): void {
    for (const group of groups) {
        if ('items' in group) {
            builder.push(group);
            processGroups(builder, group.items);
            builder.pop();
        } else {
            if ('tags' in group) {
                // builder.push(group);
                processItem(builder, group);
                // builder.pop();
            } else {
                processItem(builder, group);
            }
        }
    }
    builder.pids.gap();
}

function processItem(
    builder: GroupBuilder,
    item: ItemSpec
) {
    const context = builder.getContext();

    // Create generic
    const pid = builder.pids.next();
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
    builder.generics.push(generic);

    // Index generic PIDs by tag
    for (const tag of context.tags) {
        const s = builder.tagsToPIDs.get(tag);
        if (s) {
            s.push(pid);
        } else {
            builder.tagsToPIDs.set(tag, [pid]);
        }
    }

    // Create specifics
    for (const f of context.forms) {
        const key = generic.pid + ':' + f;
        const specific: SpecificTypedEntity = {
            kind: MENUITEM,
            name: [
                ...namePrefixFromForm(context.dimensions, f),
                generic.name,
            ].join(' '),
            sku: builder.skus.next(),
            key,
        };
        builder.specifics.push(specific);
    }
    builder.skus.gap();
}

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
        } else {
            const p = positionFromName(dimensions[i], pattern[i]);
            fields.push([p]);
        }
    }

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
    const parts = form.split(':').map(x => Number(x));
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
    if (index === a.length) {
        yield [...prefix];
    } else {
        for (const x of a[index]) {
            prefix.push(x);
            yield* generateCombinations(a, index + 1, prefix);
            prefix.pop();
        }
    }
}
