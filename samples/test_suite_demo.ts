import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import { setup, State, TestSuite } from '../src';

// This processor does nothing. Replace it with code that processes the text
// utterance to produce a new State.
let counter = 0;
async function nopProcessor(text: string, state: State): Promise<State> {
    counter++;
    if (counter % 2 === 0) {
        throw Error('hi');
    } else {
        return state;
    }
}

async function go() {
    const args = minimist(process.argv.slice(2));

    const defaultTestFile = './data/restaurant-en/test_suite.yaml';
    const testFile = path.resolve(__dirname, args['f'] || defaultTestFile);

    const showAll = args['a'] === true;
    const suiteFilter = args['s'];
    const isomorphic = args['i'] === true;

    if (suiteFilter) {
        console.log(`Running tests in suite: ${suiteFilter}`);
    } else {
        console.log('Running all tests.');
    }

    const world = setup(
        path.join(__dirname, './data/restaurant-en/products.yaml'),
        path.join(__dirname, './data/restaurant-en/options.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/rules.yaml')
    );

    const suite = TestSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    const aggregator = await suite.run(
        nopProcessor,
        world.catalog,
        suiteFilter,
        isomorphic
    );
    aggregator.print(showAll, isomorphic);
}

go();
