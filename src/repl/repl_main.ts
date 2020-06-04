import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';

import { IReplExtensionFactory } from './interfaces';
import { runRepl } from './repl_core2';

export function replMain(extensions: IReplExtensionFactory[]) {
    dotenv.config();
    const args = minimist(process.argv.slice());

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }

    if (args.h || args.help || args['?']) {
        showUsage();
        return;
    }

    if (dataPath === undefined) {
        console.log(
            'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path'
        );
        return;
    }

    // TODO: remove temporary flags '-x'.
    const useCreateWorld2 = args.x;
    if (useCreateWorld2) {
        console.log('Using experimental createWorld2()');
    }

    runRepl(dataPath, extensions, useCreateWorld2);
}

// TODO: convert this to command-line-usage
function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Interactive Menu Explorer');
    console.log('Read-Eval-Print-Loop (REPL)');
    console.log('');
    console.log(
        'An interactive tool for exploring menus and processing utterances.'
    );
    console.log('');
    console.log(`Usage: node ${program} [-d datapath] [-h|help|?]`);
    console.log('');
    console.log('-d datapath     Path to prix-fixe data files.');
    console.log('                    attributes.yaml');
    console.log('                    intents.yaml');
    console.log('                    options.yaml');
    console.log('                    products.yaml');
    console.log('                    quantifiers.yaml');
    console.log('                    rules.yaml');
    console.log('                    stopwords.yaml');
    console.log('                    units.yaml');
    console.log('                The -d flag overrides the value specified');
    console.log('                in the PRIX_FIXE_DATA environment variable.');
    console.log('-x              Use experimental createWorld2().');
    console.log('-h|help|?       Show this message.');
    console.log(' ');
}
