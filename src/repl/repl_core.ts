import * as style from 'ansi-styles';
import * as Debug from 'debug';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as replServer from 'repl';
import { Context } from 'vm';

import { ICatalog } from '../catalog';
import { createWorld, Processor, State } from '../processors';
import { TestCase, TestOrder, TestSuite, YamlTestCase } from '../test_suite';

import { formatCart, formatOrder } from './formatting';

import {
    IReplExtension,
    IReplExtensionFactory,
    ReplProcessor,
} from './interfaces';

import { speechToTextFilter } from './speech_to_text_filter';

class Session {
    utterances: string[] = [];
    yamlTestCases: YamlTestCase[] = [];
    state: State = { cart: { items: [] } };

    copy(): Session {
        const session = new Session();
        session.utterances = [...this.utterances];
        session.yamlTestCases = [...this.yamlTestCases];
        session.state = this.state;
        return session;
    }

    reset(): void {
        this.utterances = [];
        this.yamlTestCases = [];
        this.state = { cart: { items: [] } };
    }
}

const maxHistorySteps = 1000;
const historyFile = '.repl_history';

export function runRepl(dataPath: string, factories: IReplExtensionFactory[]) {
    let debugMode = false;
    Debug.enable('tf-interactive,tf:*');

    // Create the World.
    const world = createWorld(dataPath);
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
    let recordMode = false;

    // Print the welcome message.
    console.log();
    console.log('Welcome to the ShortOrder REPL.');
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
        eval: processInputLine,
        writer: myWriter,
    });

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

    repl.on('exit', () => {
        // tslint:disable-next-line:no-any
        const historyItems = ((repl as any).history as string[]).reverse();
        const history = historyItems
            .slice(Math.max(historyItems.length - maxHistorySteps, 1))
            .join('\n');
        fs.writeFileSync(historyFile, history);
        console.log('bye');
        process.exit();
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
            console.log('Cart has been reset.');
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
                const order: TestOrder = formatCart(
                    session.state.cart,
                    catalog
                );
                const orderText = formatOrder(order);
                console.log(
                    `${style.yellow.open}${orderText}${style.yellow.open}`
                );
                console.log();
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
                const order: TestOrder = formatCart(
                    session.state.cart,
                    catalog
                );
                const orderText = formatOrder(order);
                console.log(
                    `${style.yellow.open}${orderText}${style.yellow.open}`
                );
                console.log();
            } else {
                console.log('Cannot restore - stack is already empty');
            }
            repl.displayPrompt();
        },
    });

    repl.defineCommand('record', {
        help: 'Toggle YAML recording mode.',
        action(text: string) {
            recordMode = !recordMode;
            console.log(`YAML record mode ${recordMode ? 'on' : 'off'}.`);
            stack[stack.length - 1].reset();
            console.log('Cart has been reset.');
            repl.displayPrompt();
        },
    });

    repl.defineCommand('yaml', {
        help: 'Display YAML test case for cart',
        action(text: string) {
            const yamlTestCases = stack[stack.length - 1].yamlTestCases;

            if (!recordMode) {
                console.log(
                    'You must first enable YAML recording with the .record command.'
                );
            } else if (yamlTestCases.length > 0) {
                const yamlText = yaml.safeDump(yamlTestCases, { noRefs: true });
                console.log(' ');
                console.log('WARNING: test case expects short-order behavior.');
                console.log('Be sure to manually verify.');
                console.log(' ');
                console.log(yamlText);
            }
            repl.displayPrompt();
        },
    });

    async function processInputLine(
        line: string,
        context: Context,
        filename: string,
        // tslint:disable-next-line:no-any
        callback: (err: Error | null, result: any) => void
    ) {
        console.log();

        if (line === '\n') {
            repl.close();
        } else if (!processor) {
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

                    // Need to build YAML test cases here because of the async await.
                    // Build them proactively in case they are needed by the .yaml command.
                    // TODO: This is o(n^2). Come up with a better approach, as this will
                    // be problematic in the .load case.
                    if (recordMode) {
                        const session = stack[stack.length - 1];
                        session.utterances.push(text);
                        session.yamlTestCases = await cartYaml(
                            processor,
                            catalog,
                            session.utterances,
                            1,
                            ['unverified']
                        );
                    }

                    const session = stack[stack.length - 1];
                    session.state = await processor(text, session.state);
                    const order: TestOrder = formatCart(
                        session.state.cart,
                        catalog
                    );
                    const orderText = formatOrder(order);
                    console.log(
                        `${style.yellow.open}${orderText}${style.yellow.open}`
                    );
                    console.log();
                    console.log(`${style.reset.open}`);
                }
            }

            callback(null, '');
        }
    }

    function myWriter(text: string) {
        return text;
    }
}

// Generate a collection of yamlTestCase records from an array of input
// lines, each of which provides the input to a test case. Uses the
// observed output as the expected output.
async function cartYaml(
    processor: Processor,
    catalog: ICatalog,
    lines: string[],
    priority: number,
    suites: string[]
): Promise<YamlTestCase[]> {
    const emptyOrder: TestOrder = { lines: [] };

    const testLines = lines.map(x => x.trim()).filter(x => x.length > 0);
    const expected = lines.map(x => emptyOrder);
    const testCase = new TestCase(
        0,
        String(priority),
        suites,
        'generated by repl',
        testLines,
        expected
    );

    // Create a TestSuite from the TestCase, and then run it to collect
    // the observed output.
    const suite = new TestSuite([testCase]);
    const results = await suite.run(processor, catalog, undefined);

    // Generate a yamlTestCase from each Result, using the observed output
    // for the expected output.
    return results.rebase();
}
