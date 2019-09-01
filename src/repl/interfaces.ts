import * as replServer from 'repl';

import { Processor, State, World } from '../processors';

export interface ReplProcessor {
    // Name used two switch processors vis the REPL's .processor command.
    // It is a good idea to keep the name short, and easy to type, since the
    // REPL doesn't yet provide auto-complete.
    name: string;

    // Friendly description will be printed by the REPL's .processor command
    // with no arguments.
    description: string;

    // The processor.
    processor: Processor;
}

// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
export interface IReplExtension {
    // The name() is printed by a REPL status message listing the extensions
    // that have been loaded.
    name(): string;

    // Main extensibility point for providing processors to the REPL.
    // Returns null if this extension doesn't provide a processor.
    createProcessor(): ReplProcessor | null;

    // Main extensibility point for adding commands to the REPL.
    // Called during REPL startup. See Node.JS REPLServer documentation for
    // more information on registering REPL commands.
    registerCommands(repl: IRepl): void;
}

// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
export interface IReplExtensionFactory {
    // Called during REPL initialization.
    create(world: World, dataPath: string): IReplExtension;
}

// tslint:disable-next-line:interface-name
export interface IRepl {
    getReplServer(): replServer.REPLServer;
    getState(): State;
}
