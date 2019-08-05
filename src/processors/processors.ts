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
    factory: (world: World, dataPath: string) => Processor;
}

export class ProcessorFactory {
    private readonly nameToProcessor = new Map<string, ProcessorDescription>();

    constructor(processors: ProcessorDescription[]) {
        for (const processor of processors) {
            this.nameToProcessor.set(processor.name, processor);
        }
    }

    get(name: string, world: World, dataPath: string): Processor {
        if (this.nameToProcessor.has(name)) {
            return this.nameToProcessor.get(name)!.factory(world, dataPath);
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

    defaultProcessorDescription(): ProcessorDescription {
        const first = this.nameToProcessor.values().next();
        if (first.done) {
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
