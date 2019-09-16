import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as assert from 'assert';
import { TestLineItem, YamlTestCase } from '../src';

// const args = new Map();
// process.argv.forEach(function (val, index) {
//     args.set(index, val);
// });

// const getDirectories = source =>
//     fs.readdirSync(source, { withFileTypes: true })
//         .filter(dirent => dirent.isDirectory())
//         .map(dirent => dirent.name)

// const testsDirs = getDirectories(args.get(2));

// testsDirs.forEach(folder => {
//     const folderPath = `./${args.get(2)}/${folder}`;

function processOneFile(filename: string, outfile: string) {
    try {
        const originalSuite = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));

        const convertedSuite: YamlTestCase[] = [];
        for (const test of originalSuite) {
            const inputs = test.inputs as string[];
            // tslint:disable-next-line:no-any
            const carts = test.expected as Array<{ lines: TestLineItem[] }>;

            const convertedTest: YamlTestCase = {
                suites: test.suites,
                comment: test.comment,
                steps: [],
            };

            for (const [index, input] of inputs.entries()) {
                convertedTest.steps.push({
                    rawSTT: input,
                    // correctedSTT: '',
                    // correctedScope: '',
                    cart: carts[index].lines,
                });
            }

            convertedSuite.push(convertedTest);
        }

        console.log(yaml.dump(convertedSuite));
        fs.writeFileSync(outfile, yaml.dump(convertedSuite));
    } catch (e) {
        console.log(e);
    }
}

function go(filename: string) {
    processOneFile(filename, 'c:\\temp\\out.yaml');
}

// go('samples\\data\\restaurant-en\\test_suite.yaml');
//go('d:\\git\\menubot\\mochajava\\tests\\roadmap.yaml');
