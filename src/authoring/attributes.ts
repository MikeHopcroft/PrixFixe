import {
    AttributeDescription,
    DimensionAndTensorDescription,
    DimensionDescription,
    TensorDescription,
} from '../attributes';

import { InvalidParameterError } from './errors';

import {
    AID,
    DID,
    DimensionSpec,
    TID,
    TensorSpec
} from './types';
import { dim } from 'ansi-styles';

// throw 0 - error class
// io-ts validation
// name alpha-numeric validation

// Create DimensionAndTensorDescription
//   x Null tensor: "none"
//     Investigate keys for null tensor
//   Validate type
//   x Verify unique attribute names per dimension
//   x Verify unique dimension names
//   x Verify unique tensor names
//   x Verify legal names (e.g. alpha-numeric, no special characters, no reserved words)
//   x Assign DIDs, AIDs, TIDs

class IdGenerator {
    current = 0;

    next() {
        return this.current++;
    }
}

// class AttributeIndex {
//     private readonly nameToAttribute = new Map<string, AttributeDescription>();

//     constructor(
//         attributes: AttributeDescription[],
//         aids: IdGenerator
//     ) {
//         for (const a of attributes) {
//             validateName(this.nameToAttribute, a.name);

//             this.nameToAttribute.set(a.name, {...a, aid: aids.next()});
//         }
//     }

//     get(name: string) {
//         const a = this.nameToAttribute.get(name);

//         if (!a) {
//             const message = `unknown attribute ${name}`;
//             throw new InvalidParameterError(message);
//         }
//     }
// }

export interface HasName {
    name: string;
}

// tslint:disable-next-line:interface-name
export interface IIndex<ID, S> {
    get(name: string): S;
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

    get(name: string): S {
        const a = this.nameToEntry.get(name);

        if (!a) {
            const message = `cannot find "${name}" in "${this.collection}"`;
            throw new InvalidParameterError(message);
        }

        return a;
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

// interface IndexedTensor {
//     dimension: TensorDescription;
//     index: IIndex<TensorDescription>;
// }


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
                const d = dimensions.get(name).dimension;
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

// export function build(
//     ds: DimensionSpec[],
//     ts: TensorSpec[]
// ): DimensionAndTensorDescription {
//     const dimensions = processDimensions(ds);
//     const tensors = processTensors(dimensions, ts);



//     return {
//         dimensions: [...dimensions.values()].map(d => d.dimension),
//         tensors: [...tensors.values()],
//     };
// }



export function build2(
    ds: DimensionSpec[],
    ts: TensorSpec[]
): DimensionAndTensorDescription {
    let aid = 0;
    let did = 0;
    let tid = 0;

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

    // const dimensions = new Map<string, DimensionDescription>();

    // for (const d of ds) {
    //     validateName(dimensions, d.name);

    //     const attributes = new Index(
    //         `${d.name} attributes`,
    //         d.attributes,
    //         (a: typeof d.attributes[0]) => ({ ...a, aid: aid++ })
    //     );
    //     // const attributes = new Map<string, AttributeDescription>();
    //     // for (const a of d.attributes) {
    //     //     validateName(attributes, a.name);

    //     //     attributes.set(a.name, {...a, aid: aid++});
    //     // }

    //     dimensions.set(d.name, {
    //         did: did++,
    //         name: d.name,
    //         attributes: [...attributes.values()],
    //     });
    // }

    const tensors: IIndex<TID, TensorDescription> = new Index(
        'tensors',
        ts,
        (t: TensorSpec) => {
            const tensorDimensions = new Set<DimensionDescription>();
            for (const name of t.dimensions) {
                const d = dimensions.get(name).dimension;
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

    // const tensors = new Map<string, TensorDescription>();
    // tensors.set('none', {
    //         tid: tid++,
    //         name: 'none',
    //         dimensions: [],
    // });

    // for (const t of ts) {
    //     validateName(tensors, t.name);

    //     const tensorDimensions = new Set<DimensionDescription>();
    //     for (const name of t.dimensions) {
    //         const d = dimensions.get(name);
    //         // if (!d) {
    //         //     throw 0;
    //         // }
    //         if (tensorDimensions.has(d)) {
    //             throw 0;
    //         }
    //         tensorDimensions.add(d);
    //     }

    //     tensors.set(
    //         t.name,
    //         {
    //             tid: tid++,
    //             name: t.name,
    //             dimensions: [...tensorDimensions.values()].map(x => x.did),
    //         }
    //     );
    // }

    return {
        dimensions: [...dimensions.values()].map(d => d.dimension),
        tensors: [...tensors.values()],
    };
}

function validateName<T>(map: Map<string, T>, name: string) {
    // Alphanumeric + - + _
    // TODO: can we allow spaces, commas, other punctuation?
    if (!name.match(/^[A-Za-z][A-Za-z0-9\-_]*$/)) {
        throw 0;
    }

    // Unique
    if (map.has(name)) {
        throw 0;
    }
}