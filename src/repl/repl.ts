import * as replServer from 'repl';

import { IRepl } from './interfaces';

export class Repl implements IRepl {
    replServer: replServer.REPLServer;

    constructor(replServer: replServer.REPLServer) {
        this.replServer = replServer;
    }

    server() {
        return this.replServer;
    }
}
