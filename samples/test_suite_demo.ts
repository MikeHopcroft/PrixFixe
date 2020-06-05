import { TestProcessors, testRunnerMain, State, World } from '../src';

// This sample application demonstrates how to configure the test runner
// with a set of Processors.

// This example processor does nothing. Replace it with code that processes the
// text utterance to produce a new State.
let counter = 0;
async function nopProcessor(text: string, state: State): Promise<State> {
  return state;
}

// This example processor always throws.
async function throwProcessor(text: string, state: State): Promise<State> {
  throw Error('hi');
}

// This example processor alternates between doing nothing and throwing.
async function nopThrowProcessor(text: string, state: State): Promise<State> {
  counter++;
  if (counter % 2 === 0) {
    throw Error('hi');
  } else {
    return state;
  }
}

async function go() {
  // Define the processor factory.
  const processorFactory = new TestProcessors([
    {
      name: 'nop',
      description: 'does nothing',
      create: (w: World, d: string) => nopProcessor,
    },
    {
      name: 'throw',
      description: 'always throws',
      create: (w: World, d: string) => throwProcessor,
    },
    {
      name: 'both',
      description: 'alternates between doing nothing and throwing.',
      create: (w: World, d: string) => nopThrowProcessor,
    },
  ]);

  testRunnerMain('Demo', processorFactory);
}

go();
