import {
    AttributeDescription,
    DimensionAndTensorDescription,
    DimensionDescription,
    TensorDescription,
} from '../attributes';

import { InvalidParameterError, ValidationError } from './errors';

import {
    AID,
    DID,
    DimensionSpec,
    TID,
    TensorSpec
} from './types';

export interface HasName {
    name: string;
}

// tslint:disable-next-line:interface-name
export interface IIndex<ID, S> {
    // has(name: string): boolean;
    get(name: string): S | undefined;
    getById(id: ID): S;
    values(): IterableIterator<S>;
}

export class Index<ID, S, T extends HasName> implements IIndex<ID, S> {
    private readonly collection: string;
    private readonly nameToEntry = new Map<string, S>();
    private readonly idToEntry = new Map<ID, S>();

    constructor(
        collection: string,
        entries: T[],
        factory: (entry: T) => S,
        id: (entry: S) => ID
    ) {
        this.collection = collection;
        for (const a of entries) {
            validateName(this.nameToEntry, a.name);

            const value = factory(a);
            this.nameToEntry.set(a.name, value);
            this.idToEntry.set(id(value), value);
        }
    }

    // has(name: string): boolean {
    //     return this.nameToEntry.has(name);
    // }

    get(name: string): S | undefined {
        return this.nameToEntry.get(name);

        // if (!a) {
        //     const message = `cannot find "${name}" in "${this.collection}"`;
        //     throw new InvalidParameterError(message);
        // }

        // return a;
    }

    getById(id: ID) {
        const a = this.idToEntry.get(id);

        if (!a) {
            const message = `cannot find id=${id} in "${this.collection}"`;
            throw new InvalidParameterError(message);
        }

        return a;
    }

    *values(): IterableIterator<S> {
        yield* this.nameToEntry.values();
    }
}

export interface IndexedDimension {
    dimension: DimensionDescription;
    index: IIndex<AID, AttributeDescription>;
}

export function processDimensions(
    ds: DimensionSpec[]
): IIndex<DID, IndexedDimension> {
    let aid = 0;
    let did = 0;

    const dimensions: IIndex<DID, IndexedDimension> = new Index(
        'dimensions',
        ds,
        (d: DimensionSpec): IndexedDimension => {
            const attributes: IIndex<AID, AttributeDescription> = new Index(
                `${d.name} attributes`,
                d.attributes,
                (a: typeof d.attributes[0]) => ({ ...a, aid: aid++ }),
                (a: AttributeDescription) => a.aid
            );
            return {
                dimension: {
                    ...d,
                    did: did++,
                    attributes: [...attributes.values()],
                },
                index: attributes,
            };
        },
        (d: IndexedDimension) => d.dimension.did 
    );

    return dimensions;
}

export function processTensors(
    dimensions: IIndex<DID, IndexedDimension>,
    ts: TensorSpec[]
): IIndex<TID, TensorDescription> {
    let tid = 0;

    const none: TensorSpec = {
        name: 'none',
        dimensions: [],
    };

    const tensors: IIndex<TID, TensorDescription> = new Index(
        'tensors',
        [none, ...ts],
        (t: TensorSpec) => {
            const tensorDimensions = new Set<DimensionDescription>();
            for (const name of t.dimensions) {
                const indexedDimension = dimensions.get(name);
                if (indexedDimension === undefined) {
                    const message = `Cannot find dimension "${name}" in tensor "${t.name}"`;
                    throw new InvalidParameterError(message);
                }
                const d = indexedDimension.dimension;
                if (tensorDimensions.has(d)) {
                    const message =
                        `Duplicate dimension "${d.name}" in tensor "${t.name}"`;
                    throw new InvalidParameterError(message);
                }
                tensorDimensions.add(d);
            }

            return {
                ...t,
                tid: tid++,
                dimensions: [...tensorDimensions.values()].map(x => x.did),
            };
        },
        (t: TensorDescription) => t.tid
    );

    return tensors;
}


function validateName<T>(map: Map<string, T>, name: string) {
    // Alphanumeric + - + _
    // TODO: can we allow spaces, commas, other punctuation?
    if (!name.match(/^[A-Za-z][A-Za-z0-9\-_]*$/)) {
        const message = 'Names must match /^[A-Za-z][A-Za-z0-9\-_]*$/';
        throw new ValidationError(message);
    }

    // Unique
    if (map.has(name)) {
        const message = `Duplicate name "${name}"`;
        throw new ValidationError(message);
    }
}