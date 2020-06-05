import { Processor, World } from '../processors';

export interface TestProcessorFactory {
  name: string;
  description: string;
  create: (world: World, dataPath: string) => Processor;
}

export class TestProcessors {
  private readonly nameToProcessor = new Map<string, TestProcessorFactory>();

  constructor(processors: TestProcessorFactory[]) {
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

  get(name: string): TestProcessorFactory {
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

  getDefault(): TestProcessorFactory {
    const first = this.nameToProcessor.values().next();
    if (first.done) {
      // This should never happen because of check in constructor.
      const message = 'ProcessorFactory has no processors.';
      throw TypeError(message);
    } else {
      return first.value;
    }
  }

  *processors(): IterableIterator<TestProcessorFactory> {
    for (const description of this.nameToProcessor.values()) {
      yield description;
    }
  }
}
