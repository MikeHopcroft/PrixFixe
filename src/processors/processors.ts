import { Cart } from '../cart';

import { World } from './world';
import { Type } from 'js-yaml';

export interface State {
    cart: Cart;
}

export type Processor = (text: string, state: State) => Promise<State>;

export interface ProcessorDescription {
    name: string;
    description: string;
    create: (world: World, dataPath: string) => Processor;
}

export class ProcessorFactory {
    private readonly nameToProcessor = new Map<string, ProcessorDescription>();

    constructor(processors: ProcessorDescription[]) {
        if (processors.length < 1) {
            const message =
                'ProcessorFactory must have at least one ProcessorDescription.';
            throw TypeError(message);
        }
        for (const processor of processors) {
            this.nameToProcessor.set(processor.name, processor);
        }
    }

    create(name: string, world: World, dataPath: string): Processor {
        return this.get(name).create(world, dataPath);
    }

    get(name: string): ProcessorDescription {
        const description = this.nameToProcessor.get(name);
        if (description !== undefined) {
            return description;
        } else {
            const message = `Unknown processor "${name}".`;
            throw TypeError(message);
        }
    }

    has(name: string): boolean {
        return this.nameToProcessor.has(name);
    }

    count(): number {
        return this.nameToProcessor.size;
    }

    getDefault(): ProcessorDescription {
        const first = this.nameToProcessor.values().next();
        if (first.done) {
            // This should never happen because of check in constructor.
            const message = 'ProcessorFactory has no processors.';
            throw TypeError(message);
        } else {
            return first.value;
        }
    }

    *processors(): IterableIterator<ProcessorDescription> {
        for (const description of this.nameToProcessor.values()) {
            yield description;
        }
    }
}
