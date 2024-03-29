import { DID, DimensionDescription, TensorDescription } from '../attributes';

import {
  GenericEntity,
  genericEntityFactory,
  GenericTypedEntity,
  Key,
  MENUITEM,
  OPTION,
  PID,
  Role,
  SKU,
  SpecificTypedEntity,
  specificEntityFactory,
  TID,
} from '../catalog';

import { IdGenerator, InvalidParameterError } from '../utilities';

import { IIndex, IndexedDimension } from './attributes';

import {
  ContextSpec,
  FormSpec,
  GroupSpec,
  ItemSpec,
  ItemType,
  WILDCARD,
  SkuSpec,
} from './types';

///////////////////////////////////////////////////////////////////////////////
//
// Context
//
///////////////////////////////////////////////////////////////////////////////
class Context {
  tensor!: TensorDescription;
  dimensions!: DimensionDescription[];
  forms!: Set<Key>;
  defaultForm!: string;

  pids = new IdGenerator();
  skus = new IdGenerator();

  tags = new Set<string>();
  type = ItemType.PRODUCT;
  units = '';
  role = Role.ANY;

  constructor(builder: GroupBuilder) {
    // DESIGN NOTE: initializes this.tensor, this.dimensions, this.forms,
    // and this.defaultForm.
    this.initializeTensor(builder, 'none');
  }

  private initializeTensor(builder: GroupBuilder, tensor: string) {
    // WARNING: constructor() assumes this method initializes this.tensor,
    // this.dimensions, this.forms, and this.defaultForm.

    const t = builder.tensors.get(tensor);
    if (t === undefined) {
      const message = `Unknown tensor "${tensor}"`;
      throw new InvalidParameterError(message);
    }
    this.tensor = t;
    this.dimensions = t.dimensions.map(
      (x) => builder.dimensions.getById(x).dimension
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const forms = [{ include: this.tensor.dimensions.map((x) => '*') }];
    this.forms = new Set<string>();
    this.mergeForms(forms, this.dimensions);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.defaultForm = this.dimensions.map((x) => '0').join(':');

    this.verifyDefaultForm();
  }

  extend(builder: GroupBuilder, group: ContextSpec): Context {
    const { tensor, forms, pid, sku, tags, type, units, role } = group;
    const defaultForm = group.default;

    // https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance
    const context: Context = Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this
    );

    if (tensor !== undefined) {
      context.initializeTensor(builder, tensor);
    }

    // Modify the forms to generate, if specified.
    if (forms !== undefined) {
      // New forms set based on copy of original.
      context.forms = new Set<string>(context.forms);
      context.mergeForms(forms, context.dimensions);
    }

    // Modify the default form, if specified.
    if (defaultForm !== undefined) {
      context.defaultForm = keyFromAttributes(context.dimensions, defaultForm);
    }

    // Verify that the default form is one of the generated forms.
    context.verifyDefaultForm();

    if (pid !== undefined) {
      context.pids = new IdGenerator(pid);
    }

    if (sku !== undefined) {
      context.skus = new IdGenerator(sku);
    }

    // Merge in any tags that were specified.
    if (tags !== undefined) {
      // New tags set based on copy of original.
      context.tags = new Set<string>(context.tags);
      for (const tag of tags) {
        context.tags.add(tag);
      }
    }

    // TODO: can we use destructuring to copy all of the properties not handled
    // specially? Challenge is that we're copying the instance of a class, not
    // a POJO. Advantage is that the code would be less brittle because it
    // would be impossible to accidentally forget to copy a property.
    //
    // https://stackoverflow.com/questions/43011742/how-to-omit-specific-properties-from-an-object-in-javascript/43011802
    //
    if (type !== undefined) {
      context.type = type;
    }

    if (units !== undefined) {
      context.units = units;
    }

    if (role !== undefined) {
      context.role = role;
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
      const prefix = namePrefixFromForm(
        this.dimensions,
        this.defaultForm,
        true
      );
      const message = `Default form "[${prefix}]" not in set of generated forms for tensor "${this.tensor.name}"`;
      throw new InvalidParameterError(message);
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// GroupBuilder
//
///////////////////////////////////////////////////////////////////////////////
export class GroupBuilder {
  readonly generics: GenericTypedEntity[] = [];
  readonly specifics: SpecificTypedEntity[] = [];
  readonly tagsToPIDs = new Map<string, PID[]>();
  readonly pidsToUnits = new Map<PID, string>();

  readonly tensors: IIndex<TID, TensorDescription>;
  readonly dimensions: IIndex<DID, IndexedDimension>;

  private readonly context: Context[];

  private readonly pids = new Set<PID>();
  private readonly skus = new Set<SKU>();

  private readonly nameToSku = new Map<string, SKU>();

  constructor(
    dimensions: IIndex<DID, IndexedDimension>,
    tensors: IIndex<TID, TensorDescription>,
    skuSpecs: SkuSpec[]
  ) {
    this.dimensions = dimensions;
    this.tensors = tensors;

    // TODO: ensure that all SKU specs are used.
    // TODO: verify that all SKU specs are legal/allowed.
    // TODO: some mechanism to disable/suppress sku generation.
    for (const spec of skuSpecs) {
      if (this.nameToSku.has(spec.name)) {
        const message = `Duplicate name "${spec.name}"`;
        throw new TypeError(message);
      }
      if (this.skus.has(spec.sku)) {
        const message = `Duplicate sku ${spec.sku}`;
        throw new TypeError(message);
      }
      this.nameToSku.set(spec.name, spec.sku);
      this.skus.add(spec.sku);
    }

    // WARNING: createTensorContext() relies on this.tensors and
    // this.dimensions.
    this.context = [new Context(this)];
  }

  getContext(): Context {
    return this.context[this.context.length - 1];
  }

  nextPID(): PID {
    const pid = this.getContext().pids.next();
    if (this.pids.has(pid)) {
      const message = `Duplicate pid ${pid}`;
      throw new InvalidParameterError(message);
    }
    this.pids.add(pid);
    return pid;
  }

  nextSKU(name: string): SKU {
    let sku = this.nameToSku.get(name);
    if (sku !== undefined) {
      return sku;
    }

    if (this.nameToSku.size > 0) {
      const message = `No SKU specified for "${name}"`;
      throw new TypeError(message);
    }

    sku = this.getContext().skus.next();
    if (this.skus.has(sku)) {
      const message = `Duplicate sku ${sku}`;
      throw new InvalidParameterError(message);
    }
    this.skus.add(sku);
    return sku;
  }

  push(group: ContextSpec) {
    this.context.push(this.getContext().extend(this, group));
  }

  pop() {
    if (this.context.length === 1) {
      const message = 'Context stack underflow';
      throw new InvalidParameterError(message);
    }
    this.context.pop();
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// processGroups(), processItem()
//
///////////////////////////////////////////////////////////////////////////////
export function processGroups(
  builder: GroupBuilder,
  groups: GroupSpec[]
): void {
  for (const group of groups) {
    if ('items' in group) {
      builder.push(group);
      processGroups(builder, group.items);
      builder.pop();
    } else {
      // TODO: REVIEW: [] is not false. Are the semantics below correct?
      if (group.default || group.forms || group.tags || group.tensor) {
        builder.push(group);
        processItem(builder, group);
        builder.pop();
      } else {
        builder.push(group);
        processItem(builder, group);
        builder.pop();
      }
    }
  }
  builder.getContext().pids.gap();
}

function makeKey(pid: number, defaultForm: string) {
  if (defaultForm) {
    return [pid, defaultForm].join(':');
  } else {
    return pid.toString();
  }
}

function processItem(builder: GroupBuilder, item: ItemSpec) {
  const context = builder.getContext();

  // Create generic
  const pid = builder.nextPID();
  const defaultKey = makeKey(pid, context.defaultForm); // [pid, context.defaultForm].join(':');
  const entity: GenericEntity = {
    name: item.name,
    pid,
    cid: 0,
    aliases: item.aliases,
    tensor: context.tensor.tid,
    defaultKey,
    fuzzerHints: {
      role: context.role,
      units: context.units,
    },
  };
  const kind = context.type === ItemType.PRODUCT ? MENUITEM : OPTION;
  const generic = genericEntityFactory(entity, kind);
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

  // TODO: remove indexing of units.
  // Index units
  if (context.units) {
    builder.pidsToUnits.set(pid, context.units);
  }

  // Create specifics
  for (const f of context.forms) {
    const key = makeKey(generic.pid, f);
    const name = [
      ...namePrefixFromForm(context.dimensions, f, false),
      generic.name,
    ].join(' ');
    const sku = builder.nextSKU(name);
    const specific: SpecificTypedEntity = specificEntityFactory(
      { name, sku, key },
      kind
    );
    builder.specifics.push(specific);
  }
  builder.getContext().skus.gap();
}

///////////////////////////////////////////////////////////////////////////////
//
// Helper functions
//
///////////////////////////////////////////////////////////////////////////////
function* generateForms(
  dimensions: DimensionDescription[],
  pattern: string[]
): IterableIterator<string> {
  if (dimensions.length !== pattern.length) {
    const message = 'dimensions.length !== pattern.length';
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
    const message = 'd.length !== attributes.length';
    throw new InvalidParameterError(message);
  }

  const k = attributes.map((name, i) => positionFromName(d[i], name));
  return k.join(':');
}

function namePrefixFromForm(
  d: DimensionDescription[],
  form: string,
  showHidden: boolean
) {
  if (d.length > 0) {
    const parts = form.split(':').map((x) => Number(x));
    const names: string[] = [];
    for (const [i, part] of parts.entries()) {
      const a = d[i].attributes[part];
      if (!a.hidden || showHidden) {
        names.push(a.name);
      }
    }
    return names;
  } else {
    return '';
  }
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
