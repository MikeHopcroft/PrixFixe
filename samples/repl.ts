import * as replServer from 'repl';

import {
    IReplExtensionFactory,
    prixFixeReplExtensionFactory,
    ReplProcessor,
    replMain,
    State,
    World,
    IReplExtension,
} from '../src';

// Sample ReplExtension that registers one command and provides a Processor
// that leaves the State unchanged.
class NopReplExtension implements IReplExtension {
    name(): string {
        return 'nop';
    }

    createProcessor(): ReplProcessor | null {
        return {
            name: 'nop',
            description: 'Sample processor that leaves the State unchanged.',
            processor: async (text: string, state: State): Promise<State> =>
                state,
        };
    }

    registerCommands(repl: replServer.REPLServer): void {
        repl.defineCommand('hello', {
            help: 'Say hello.',
            action(text: string) {
                console.log(`Hello ${text}!`);
                repl.displayPrompt();
            },
        });
    }
}

export const nopReplExtensionFactory: IReplExtensionFactory = {
    create: (world: World, dataPath: string) => {
        return new NopReplExtension();
    },
};

// Sample application that configures and runs the REPL.
function go() {
    replMain([nopReplExtensionFactory, prixFixeReplExtensionFactory]);
}

go();
