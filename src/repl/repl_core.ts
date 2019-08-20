import * as style from 'ansi-styles';
import * as Debug from 'debug';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as replServer from 'repl';
import { Context } from 'vm';

import { ICatalog } from '../catalog';
import { createWorld, Processor, State, World } from '../processors';
import { TestLineItem, TestOrder, YamlTestCase } from '../test_suite';

import { displayState } from './formatting';

import {
    IRepl,
    IReplExtension,
    IReplExtensionFactory,
    ReplProcessor,
} from './interfaces';

import { speechToTextFilter } from './speech_to_text_filter';
import { ItemInstance } from '../cart';

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

const maxHistorySteps = 1000;
const historyFile = '.repl_history';

export function runRepl(
    dataPath: string,
    factories: IReplExtensionFactory[],
    world?: World
) {
    let debugMode = false;
    Debug.enable('tf-interactive,tf:*');

    // Create the world if an existing one is not provided
    if (!world) {
        world = createWorld(dataPath);
    }

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
            console.log(
                `  Registering ${processor.name} processor: ${processor.description}`
            );
            processors.push(processor);
        }
    }

    // Set the default processor.
    let processor: Processor | undefined = undefined;
    if (processors.length > 0) {
        processor = processors[0].processor;
        console.log(`Current processor is ${processors[0].name}.`);
    } else {
        console.log(`No processor registered.`);
    }

    // Configure YAML recording stack of Session objects.
    const stack: Session[] = [new Session()];

    // Variables related to the .newtest, .step, .suites, .comment, and .yaml commands.
    // TODO: put these into a dedicated class related to YAML test authoring.
    let steps: Turn[] = [];
    let comment = '';
    let suites: string[] = [];
    let priority = 1;

    // Print the welcome message.
    console.log();
    console.log('Welcome to the ShortOrder REPL.');
    console.log('Type your order below.');
    console.log('A blank line exits.');
    console.log();
    console.log('Type .help for information on commands.');
    console.log();

    // Start up the REPL.
    const repl: IRepl = {
        server: replServer.start({
            prompt: '% ',
            input: process.stdin,
            output: process.stdout,
            eval: processReplInput,
            writer: myWriter,
        }),
    };

    // Register commands from REPL extensions.
    for (const extension of extensions) {
        extension.registerCommands(repl);
    }

    // Load REPL history from file.
    if (fs.existsSync(historyFile)) {
        fs.readFileSync(historyFile)
            .toString()
            .split('\n')
            .reverse()
            .filter((line: string) => line.trim())
            // tslint:disable-next-line:no-any
            .map((line: string) => (repl as any).history.push(line));
    }

    //
    // Register core commands.
    //

    repl.server.on('exit', () => {
        // tslint:disable-next-line:no-any
        const historyItems = ((repl as any).history as string[]).reverse();
        const history = historyItems
            .slice(Math.max(historyItems.length - maxHistorySteps, 1))
            .join('\n');
        fs.writeFileSync(historyFile, history);
        console.log('bye');
        process.exit();
    });

    repl.server.defineCommand('cart', {
        help: 'Display shopping cart.',
        action(text: string) {
            const session = stack[stack.length - 1];
            displayState(catalog, session.state());
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('newtest', {
        help: 'Start authoring a new yaml test',
        action(text: string) {
            console.log('Creating new yaml test.');
            console.log('Cart has been reset.');
            const session = stack[stack.length - 1];
            session.reset();
            steps = [];
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('step', {
        help: 'Add a new step to a yaml test',
        async action(text: string) {
            const session = stack[stack.length - 1];
            const state = session.state();
            steps.push({ input: text, state });

            await processInputLine(text);

            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('comment', {
        help: 'Set the current for the current yaml test',
        action(text: string) {
            comment = text;
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('priority', {
        help: 'Set the priority field for the current yaml test',
        action(text: string) {
            priority = Number(text);
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('suites', {
        help: 'Set the suites field for the current yaml test',
        action(text: string) {
            suites = text.split(/\s+/);
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('list', {
        help: 'Display the steps in the current test',
        action(text: string) {
            console.log(`Priority: ${priority}`);
            console.log(`Suites: ${suites.join(' ')}`);
            console.log(`Comment: ${comment}`);
            for (const turn of steps) {
                console.log(`Input: "${turn.input}"`);
                displayState(catalog, turn.state);
            }
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('yaml', {
        help: 'Print the yaml for the current test',
        action(text: string) {
            repl.server.displayPrompt();

            const yamlTestCases = cartYaml2(
                catalog,
                steps,
                priority,
                suites,
                comment
            );
            const yamlText = yaml.safeDump(yamlTestCases, { noRefs: true });
            console.log(' ');
            console.log(`${style.red.open}`);
            console.log('WARNING: test case expects short-order behavior.');
            console.log('Be sure to manually verify.');
            console.log(`${style.red.close}`);
            console.log(' ');
            console.log(yamlText);
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('debug', {
        help: 'Toggle debug mode.',
        action(text: string) {
            debugMode = !debugMode;
            console.log(`Debug mode ${debugMode ? 'on' : 'off'}.`);
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('processor', {
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
                        break;
                    }
                }
                if (!found) {
                    console.log(`Cannot find processor ${name}.`);
                }
            }
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('reset', {
        help: 'Clear shopping cart.',
        action(text: string) {
            stack[stack.length - 1].reset();
            const session = stack[stack.length - 1];
            updateSteps(session.state());
            console.log('Cart has been reset.');
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('push', {
        help: 'Push shopping cart on the stack.',
        action(text: string) {
            stack.push(stack[stack.length - 1].copy());
            console.log('Cart has been pushed onto the stack.');
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('pop', {
        help: 'Pop shopping cart from the stack.',
        action(text: string) {
            console.log(`stack.length = ${stack.length}`);
            if (stack.length > 1) {
                stack.pop();
                const session = stack[stack.length - 1];
                updateSteps(session.state());
                displayState(catalog, session.state());
            } else {
                console.log('Cannot pop - stack is already empty');
            }
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('restore', {
        help: 'Restore cart to top of stack without popping.',
        action(text: string) {
            if (stack.length > 1) {
                stack.pop();
                stack.push(stack[stack.length - 1].copy());
                const session = stack[stack.length - 1];
                updateSteps(session.state());
                displayState(catalog, session.state());
            } else {
                console.log('Cannot restore - stack is already empty');
            }
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('undo', {
        help: 'Undo last utterance',
        action(text: string) {
            const session = stack[stack.length - 1];
            if (session.undo()) {
                updateSteps(session.state());
                displayState(catalog, session.state());
            } else {
                console.log('Nothing to undo.');
            }
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('redo', {
        help: 'Redo utterance after undo',
        action(text: string) {
            const session = stack[stack.length - 1];
            if (session.redo()) {
                updateSteps(session.state());
                displayState(catalog, session.state());
            } else {
                console.log('Nothing to redo.');
            }
            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('try', {
        help: 'Try out an utterance without changing the cart.',
        async action(text: string) {
            const session = stack[stack.length - 1];
            await processInputLine(text);
            session.undo();

            repl.server.displayPrompt();
        },
    });

    repl.server.defineCommand('rawyaml', {
        help: 'Display YAML test case for cart',
        action(text: string) {
            const session = stack[stack.length - 1];
            const turns = session.getTurns();

            const yamlTestCases = cartYaml2(
                catalog,
                turns,
                1,
                ['unverified'],
                'generated by repl'
            );
            const yamlText = yaml.safeDump(yamlTestCases, { noRefs: true });
            console.log(' ');
            console.log(`${style.red.open}`);
            console.log('WARNING: test case expects short-order behavior.');
            console.log('Be sure to manually verify.');
            console.log(`${style.red.close}`);
            console.log(' ');
            console.log(yamlText);

            repl.server.displayPrompt();
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
            repl.server.close();
        } else {
            await processInputLine(line);
            callback(null, '');
        }
    }

    async function processInputLine(line: string) {
        if (!processor) {
            console.log('Unable to process input text.');
            console.log('No processors available.');
            console.log('See the .processor command for more information.');
            repl.server.displayPrompt();
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
                        console.log(`${style.red.open}`);
                        console.log(
                            '********************************************************'
                        );
                        console.log(
                            'PLEASE NOTE: your input has been modified to be more'
                        );
                        console.log(
                            'like the output of a speech-to-text system.'
                        );
                        console.log(`your input: "${line}"`);
                        console.log(`modified:   "${text}"`);
                        console.log(
                            '********************************************************'
                        );
                        console.log(`${style.red.close}`);
                    }

                    const session = stack[stack.length - 1];
                    const state = await processor(text, session.state());
                    session.takeTurn(text, state);
                    updateSteps(state);
                    // if (steps.length > 0) {
                    //     steps[steps.length - 1].state = state;
                    // }

                    displayState(catalog, state);
                }
            }
        }
    }

    function updateSteps(state: State) {
        if (steps.length > 0) {
            steps[steps.length - 1].state = state;
        }
    }

    function myWriter(text: string) {
        return text;
    }
}

function cartYaml2(
    catalog: ICatalog,
    turns: Turn[],
    priority: number,
    suites: string[],
    comment: string
): YamlTestCase[] {
    const inputs: string[] = [];
    const expected: TestOrder[] = [];
    for (const turn of turns) {
        inputs.push(turn.input);
        expected.push(testOrderFromState(catalog, turn.state));
    }

    const testCase: YamlTestCase = {
        priority,
        suites: suites.join(' '),
        comment,
        inputs,
        expected,
    };

    return [testCase];
}

function testOrderFromState(catalog: ICatalog, state: State): TestOrder {
    const lines: TestLineItem[] = [];
    for (const item of state.cart.items) {
        testOrderFromItem(catalog, lines, item, 0);
    }
    return {
        lines,
    };
}

function testOrderFromItem(
    catalog: ICatalog,
    lines: TestLineItem[],
    item: ItemInstance,
    indent: number
): void {
    lines.push({
        indent,
        quantity: item.quantity,
        key: item.key,
        name: catalog.getSpecific(item.key).name,
    });
    for (const child of item.children) {
        testOrderFromItem(catalog, lines, child, indent + 1);
    }
}
