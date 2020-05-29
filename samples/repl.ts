import {
    IRepl,
    IReplExtension,
    IReplExtensionFactory,
    prixFixeReplExtensionFactory,
    ReplProcessor,
    replMain,
    simpleReplExtensionFactory,
    State,
    World,
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
            description: 'Simple processor that leaves the State unchanged.',
            processor: async (text: string, state: State): Promise<State> =>
                state,
        };
    }

    registerCommands(repl: IRepl): void {
        repl.getReplServer().defineCommand('hello', {
            help: 'Say hello.',
            action(text: string) {
                console.log(`Hello ${text}!`);
                repl.getReplServer().displayPrompt();
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
    replMain([
        // nopReplExtensionFactory,
        prixFixeReplExtensionFactory,
        simpleReplExtensionFactory,
    ]);
}

go();
