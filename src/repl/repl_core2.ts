import * as style from 'ansi-styles';
import * as Debug from 'debug';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as replServer from 'repl';
import { Context } from 'vm';

import { Cart } from '../core/cart';
import { ICatalog } from '../core/catalog';
import { Processor, State } from '../core/processors';
import { createWorld, createWorld2 } from '../processors';

import {
  AnyTurn,
  createMenuBasedRepairFunction,
  GenericCase,
  logicalCartFromCart,
  LogicalValidationSuite,
  ScoredStep,
  scoreSuite,
  TextTurn,
  ValidationStep,
} from '../test_suite2';

import { displayState } from './formatting';

import {
  IRepl,
  IReplExtension,
  IReplExtensionFactory,
  ReplProcessor,
} from './interfaces';

import { speechToTextFilter } from '../core/utilities/speech_to_text_filter';

interface Turn {
  input: string;
  state: State;
}

class Session {
  private undoStack: Turn[] = [];
  private redoStack: Turn[] = [];

  state(): State {
    if (this.undoStack.length > 0) {
      return this.undoStack[this.undoStack.length - 1].state;
    } else {
      return { cart: { items: [] } };
    }
  }

  getTurns(): Turn[] {
    return this.undoStack;
  }

  takeTurn(input: string, state: State) {
    this.undoStack.push({ input, state });
    this.redoStack = [];
  }

  undo(): boolean {
    if (this.undoStack.length > 0) {
      this.redoStack.push(this.undoStack.pop()!);
      return true;
    } else {
      return false;
    }
  }

  redo(): boolean {
    if (this.redoStack.length > 0) {
      this.undoStack.push(this.redoStack.shift()!);
      return true;
    } else {
      return false;
    }
  }

  copy(): Session {
    const session = new Session();
    session.undoStack = [...this.undoStack];
    session.redoStack = [...this.redoStack];
    return session;
  }

  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

class TestBuilder {
  private readonly catalog: ICatalog;
  private steps: Turn[] = [];
  private comment = '';
  private suites: string[] = [];
  private speaker: string;

  constructor(catalog: ICatalog) {
    this.catalog = catalog;
    this.speaker = 'speaker';
  }

  getComment() {
    return this.comment;
  }

  setCommment(comment: string) {
    this.comment = comment;
  }

  setSpeaker(speaker: string) {
    this.speaker = speaker;
  }

  getSuites() {
    return this.suites;
  }

  setSuites(suites: string[]) {
    this.suites = suites;
  }

  addStep(input: string, state: State) {
    this.steps.push({ input, state });
  }

  clearSteps() {
    this.steps = [];
  }

  getSteps() {
    return this.steps;
  }

  updateStep(state: State) {
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].state = state;
    }
  }

  createValidationSuite(): LogicalValidationSuite<TextTurn> {
    const tests: Array<GenericCase<ValidationStep<TextTurn>>> = [];
    const steps: Array<ValidationStep<TextTurn>> = [];
    for (const step of this.steps) {
      const cart = logicalCartFromCart(step.state.cart, this.catalog);
      const turns = [
        {
          speaker: this.speaker,
          transcription: step.input,
        },
      ];
      steps.push({ turns, cart });
    }

    return {
      tests: [
        {
          id: 0,
          suites: this.suites.join(' '),
          comment: this.comment,
          steps,
        },
      ],
    };
  }
}

const maxHistorySteps = 1000;
const historyFile = '.repl_history';

class ReplCore implements IRepl {
  repl: replServer.REPLServer;
  stack: Session[];

  constructor(
    dataPath: string,
    factories: IReplExtensionFactory[],
    // TODO: remove temporary parameter.
    useCreateWorld2 = false
  ) {
    let debugMode = false;
    Debug.enable('tf-interactive,tf:*');

    const world = useCreateWorld2
      ? createWorld2(dataPath)
      : createWorld(dataPath);
    const catalog = world.catalog;

    // Incorporate REPL extensions.
    const extensions: IReplExtension[] = [];
    const processors: ReplProcessor[] = [];
    for (const factory of factories) {
      const extension = factory.create(world, dataPath);
      extensions.push(extension);
      console.log(`Loaded ${extension.name()} extension.`);

      const processor = extension.createProcessor();
      if (processor) {
        // console.log(
        //     `  Registering ${processor.name} processor: ${processor.description}`
        // );
        processors.push(processor);
      }
    }

    // Set the default processor.
    let processor: Processor | undefined = undefined;
    if (processors.length > 0) {
      processor = processors[0].processor;
      // console.log(`Current processor is ${processors[0].description}.`);
    } else {
      console.log(`No processor registered.`);
    }

    // Configure YAML recording stack of Session objects.
    const stack: Session[] = [new Session()];
    this.stack = stack;

    // Variables related to the .newtest, .step, .suites, .comment, and .yaml commands.
    const testCase = new TestBuilder(catalog);

    // Print the welcome message.
    console.log();
    console.log('Welcome to the PrixFixe REPL.');
    console.log('Type your order below.');
    console.log('A blank line exits.');
    console.log();
    console.log('Type .help for information on commands.');
    console.log();

    // Start up the REPL.
    const repl = replServer.start({
      prompt: '% ',
      input: process.stdin,
      output: process.stdout,
      eval: processReplInput,
      writer: myWriter,
    });
    this.repl = repl;

    // Register commands from REPL extensions.
    for (const extension of extensions) {
      extension.registerCommands(this);
    }

    // Load REPL history from file.
    if (fs.existsSync(historyFile)) {
      // tslint:disable-next-line:no-any
      if ((repl as any).history === undefined) {
        // This check and initialization is needed for running
        // via spawn.
        // tslint:disable-next-line:no-any
        (repl as any).history = [];
      }
      fs.readFileSync(historyFile)
        .toString()
        // Split on \n (linux) or \r\n (windows)
        .split(/\n|\r|\r\n|\n\r/g)
        .reverse()
        .filter((line: string) => line.trim())
        // tslint:disable-next-line:no-any
        .map((line: string) => (repl as any).history.push(line));
    }

    //
    // Register core commands.
    //

    repl.on('exit', () => {
      // tslint:disable:no-any
      const historyItems = [...(repl as any).history].reverse();
      const history = historyItems
        .slice(Math.max(historyItems.length - maxHistorySteps, 0))
        .join('\n');
      fs.writeFileSync(historyFile, history);
      console.log('bye');
      process.exit();
    });

    repl.defineCommand('cart', {
      help: 'Display shopping cart.',
      action(text: string) {
        const session = stack[stack.length - 1];
        displayState(catalog, session.state());
        repl.displayPrompt();
      },
    });

    repl.defineCommand('newtest', {
      help: 'Start authoring a new yaml test',
      action(text: string) {
        console.log('Creating new yaml test.');
        console.log('Cart has been reset.');
        console.log(' ');
        const session = stack[stack.length - 1];
        session.reset();
        testCase.clearSteps();
        repl.displayPrompt();
      },
    });

    repl.defineCommand('step', {
      help: 'Add a new step to a yaml test',
      async action(text: string) {
        const session = stack[stack.length - 1];
        const state = session.state();
        testCase.addStep(text, state);

        await processInputLine(text);

        // DESIGN NOTE: This console.log() is necessary to generate a newline
        // in the case of an empty cart so that scriptHandshake() can identify
        // the prompt.
        console.log(' ');

        repl.displayPrompt();
      },
    });

    repl.defineCommand('comment', {
      help: 'Set the comment for the current yaml test',
      action(text: string) {
        testCase.setCommment(text);
        console.log(`Comment set to "${text}"`);
        console.log(' ');
        repl.displayPrompt();
      },
    });

    repl.defineCommand('speaker', {
      help: 'Set the speaker for the current yaml test',
      action(text: string) {
        testCase.setSpeaker(text);
        console.log(`Speaker set to "${text}"`);
        console.log(' ');
        repl.displayPrompt();
      },
    });

    repl.defineCommand('suites', {
      help: 'Set the suites field for the current yaml test',
      action(text: string) {
        testCase.setSuites(text.split(/\s+/));
        console.log(`Suites set to "${text}"`);
        console.log(' ');
        repl.displayPrompt();
      },
    });

    repl.defineCommand('list', {
      help: 'Display the steps in the current test',
      action(text: string) {
        console.log(`Suites: ${testCase.getSuites().join(' ')}`);
        console.log(`Comment: ${testCase.getComment()}`);
        for (const step of testCase.getSteps()) {
          console.log(`Input: "${step.input}"`);
          displayState(catalog, step.state);
        }

        repl.displayPrompt();
      },
    });

    repl.defineCommand('yaml', {
      help: 'Print the yaml for the current test',
      action(text: string) {
        const yamlTestCases = testCase.createValidationSuite();
        const yamlText = yaml.safeDump(yamlTestCases, { noRefs: true });
        console.log(`${style.red.open}`);
        console.log('WARNING: test case expects short-order behavior.');
        console.log('Be sure to manually verify.');
        console.log(`${style.red.close}`);
        console.log(' ');
        console.log(yamlText);
        repl.displayPrompt();
      },
    });

    repl.defineCommand('debug', {
      help: 'Toggle debug mode.',
      action(text: string) {
        debugMode = !debugMode;
        console.log(`Debug mode ${debugMode ? 'on' : 'off'}.`);
        repl.displayPrompt();
      },
    });

    repl.defineCommand('processor', {
      help: 'Switch processors',
      action(text: string) {
        const name = text.trim();
        if (name.length === 0) {
          console.log('Available processors:');
          for (const p of processors) {
            console.log(`  ${p.name}: ${p.description}`);
          }
        } else {
          let found = false;
          for (const p of processors) {
            if (p.name === name) {
              found = true;
              console.log(`Switched to ${p.name} processor.`);
              processor = p.processor;
              break;
            }
          }
          if (!found) {
            console.log(`Cannot find processor ${name}.`);
          }
        }
        repl.displayPrompt();
      },
    });

    repl.defineCommand('reset', {
      help: 'Clear shopping cart.',
      action(text: string) {
        stack[stack.length - 1].reset();
        const session = stack[stack.length - 1];
        testCase.updateStep(session.state());
        console.log('Cart has been reset.');
        console.log(' ');
        repl.displayPrompt();
      },
    });

    repl.defineCommand('push', {
      help: 'Push shopping cart on the stack.',
      action(text: string) {
        stack.push(stack[stack.length - 1].copy());
        console.log('Cart has been pushed onto the stack.');
        repl.displayPrompt();
      },
    });

    repl.defineCommand('pop', {
      help: 'Pop shopping cart from the stack.',
      action(text: string) {
        console.log(`stack.length = ${stack.length}`);
        if (stack.length > 1) {
          stack.pop();
          const session = stack[stack.length - 1];
          testCase.updateStep(session.state());
          displayState(catalog, session.state());
        } else {
          console.log('Cannot pop - stack is already empty');
        }
        repl.displayPrompt();
      },
    });

    repl.defineCommand('restore', {
      help: 'Restore cart to top of stack without popping.',
      action(text: string) {
        if (stack.length > 1) {
          stack.pop();
          stack.push(stack[stack.length - 1].copy());
          const session = stack[stack.length - 1];
          testCase.updateStep(session.state());
          displayState(catalog, session.state());
        } else {
          console.log('Cannot restore - stack is already empty');
        }
        repl.displayPrompt();
      },
    });

    repl.defineCommand('undo', {
      help: 'Undo last utterance',
      action(text: string) {
        const session = stack[stack.length - 1];
        if (session.undo()) {
          testCase.updateStep(session.state());
          displayState(catalog, session.state());
        } else {
          console.log('Nothing to undo.');
        }
        repl.displayPrompt();
      },
    });

    repl.defineCommand('redo', {
      help: 'Redo utterance after undo',
      action(text: string) {
        const session = stack[stack.length - 1];
        if (session.redo()) {
          testCase.updateStep(session.state());
          displayState(catalog, session.state());
        } else {
          console.log('Nothing to redo.');
        }
        repl.displayPrompt();
      },
    });

    repl.defineCommand('try', {
      help: 'Try out an utterance without changing the cart.',
      async action(text: string) {
        const session = stack[stack.length - 1];
        await processInputLine(text);
        session.undo();

        repl.displayPrompt();
      },
    });

    let expected: Cart = { items: [] };

    repl.defineCommand('expect', {
      help: 'Set the expected cart for use by the .score command.',
      action(text: string) {
        expected = stack[stack.length - 1].state().cart;
        console.log('Expected cart set');
        repl.displayPrompt();
      },
    });

    repl.defineCommand('score', {
      help: 'Score current cart against expected cart.',
      action(text: string) {
        const eSuite = suiteFromCart(world.catalog, expected);

        const observed = stack[stack.length - 1].state().cart;
        const oSuite = suiteFromCart(world.catalog, observed);

        const repairFunction = createMenuBasedRepairFunction(
          world.attributeInfo,
          world.catalog
        );

        // TODO: replace xyz
        const scored = scoreSuite(oSuite, eSuite, repairFunction, 'xyz');

        if (scored.measures.perfectSteps === 1) {
          console.log('Carts are identical');
        } else if (scored.measures.completeSteps === 1) {
          console.log(
            'Carts are complete. They contain the same items, but in different order.'
          );
        } else {
          console.log('Carts are different.');
          console.log(`Total repairs: ${scored.measures.totalRepairs}`);
          const testCase = scored.tests[0] as GenericCase<ScoredStep<AnyTurn>>;
          const steps = testCase.steps[0].measures.repairs!.steps;
          for (const [i, step] of steps.entries()) {
            console.log(`  ${i}: ${step}`);
          }
        }
        console.log(' ');

        repl.displayPrompt();
      },
    });

    async function processReplInput(
      line: string,
      context: Context,
      filename: string,
      // tslint:disable-next-line:no-any
      callback: (err: Error | null, result: any) => void
    ) {
      console.log();
      if (line === '\n') {
        repl.close();
      } else {
        if (!line.startsWith('#')) {
          // TODO: BUGBUG: might want to put comment handling into
          // processInputLine, since it handles multiple lines.
          // Line is not a comment. Process it.
          await processInputLine(line);
        }
        callback(null, '');
      }
    }

    async function processInputLine(line: string) {
      if (!processor) {
        console.log('Unable to process input text.');
        console.log('No processors available.');
        console.log('See the .processor command for more information.');
        repl.displayPrompt();
      } else {
        const lines = line.split(/[\n\r]/);
        if (lines[lines.length - 1].length === 0) {
          // Remove last empty line so that we can distinguish whether
          // we're in interactive mode or doing a .load.
          lines.pop();
        }
        for (line of lines) {
          if (line.length > 0) {
            // Only process lines that have content.
            // In an interactive session, an empty line will exit.
            // When using .load, empty lines are ignored.

            if (lines.length > 1) {
              // When we're processing multiple lines, for instance
              // via the .load command, print out each line before
              // processing.
              console.log(`CUSTOMER: "${line}"`);
              console.log();
            }

            const text = speechToTextFilter(line);
            if (text !== line) {
              const stars =
                '********************************************************';
              console.log(`${style.red.open}${stars}`);
              console.log(
                'PLEASE NOTE: your input has been modified to be more'
              );
              console.log('like the output of a speech-to-text system.');
              console.log(`your input: "${line}"`);
              console.log(`modified:   "${text}"`);
              console.log(`${stars}${style.red.close}`);
              console.log(' ');
            }

            const session = stack[stack.length - 1];
            const state = await processor(text, session.state());
            session.takeTurn(text, state);
            testCase.updateStep(state);
            displayState(catalog, state);
          }
        }
      }
    }

    function myWriter(text: string) {
      return text;
    }
  }

  getReplServer(): replServer.REPLServer {
    return this.repl;
  }

  getState(): State {
    const session = this.stack[this.stack.length - 1];
    return session.state();
  }
}

function suiteFromCart(
  catalog: ICatalog,
  cart: Cart
): LogicalValidationSuite<AnyTurn> {
  return {
    tests: [
      {
        id: 0,
        suites: '',
        comment: '',
        steps: [
          {
            turns: [],
            cart: logicalCartFromCart(cart, catalog),
          },
        ],
      },
    ],
  };
}

export function runRepl(
  dataPath: string,
  factories: IReplExtensionFactory[],
  useCreateWorld2 = false
) {
  const repl = new ReplCore(dataPath, factories, useCreateWorld2);
}
