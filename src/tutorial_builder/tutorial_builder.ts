import { spawnSync } from 'child_process';
import stripAnsi = require('strip-ansi');

import {
    AnyBlock,
    CodeBlockType,
    createBlock,
    parseMarkdown,
    ReplBlock,
} from './markdown_parser';

import { scriptHandshake } from './script_handshake';

export async function updateMarkdown(text: string) {
    let blocks = parseMarkdown(text);

    blocks = processRepair(blocks);
    blocks = await processRepl(blocks);
    blocks = await processSpawn(blocks);

    return combine(blocks);
}

function processRepair(blocks: AnyBlock[]): AnyBlock[] {
    const re = /(\s*\d+\s+(.+)\s+\()(\d+(?:\.\d+))(\)\s*)/;

    function replacer(
        match: string,
        left: string,
        name: string,
        sku: string,
        right: string
    ) {
        return left + 'SKU=' + sku + right;
    }

    return blocks.map(block => {
        if (block.type === CodeBlockType.REPAIR) {
            const lines = block.lines.map((line, i) => {
                if (i < 2 || i === block.lines.length - 1) {
                    return line;
                } else {
                    // return 'REPAIRED: ' + line;
                    return line.replace(re, replacer);
                }
            });
            return createBlock('verbatim', lines);
        } else {
            return block;
        }
    });
}

async function processRepl(blocks: AnyBlock[]): Promise<AnyBlock[]> {
    // Make a script by extracting shell input from code blocks.
    const replBlocks = blocks.filter(
        block => block.type === CodeBlockType.REPL
    ) as ReplBlock[];
    const scriptLines = makeScript(replBlocks);

    // Run the script to gather new output.
    const outputLines = await runScript(scriptLines);

    // Break the output into sections corresponding to code blocks.
    const outputSections = makeOutputSections(outputLines);

    let i = 0;
    return blocks.map(block => {
        if (block.type === CodeBlockType.REPL) {
            return createBlock(
                'verbatim',
                ['~~~', ...outputSections[i++], '~~~']
            );
        } else {
            return block;
        }
    });
}

async function processSpawn(blocks: AnyBlock[]): Promise<AnyBlock[]> {
    return blocks.map(block => {
        if (block.type === CodeBlockType.SPAWN) {
            const program = spawnSync(
                block.executable,
                block.args
            );
            const ostream = program.stdout;

            return createBlock('verbatim', [
                `~~~`,
                `$ ${block.executable} ${block.args.join(' ')}`,
                ostream,
                `~~~`,
            ]);
        } else {
            return block;
        }
    });
}

function combine(blocks: AnyBlock[]): string {
    const lines: string[] = [];
    for (const block of blocks) {
        if (block.type !== CodeBlockType.VERBATIM) {
            const message = `Expected VERBATIM block but found ${block.type}`;
            throw new TypeError(message);
        }
        lines.push(...block.lines);
    }
    return lines.join('\n');
}

function makeScript(replBlocks: ReplBlock[]) {
    const re = /%\s(.*)/;
    const codeLines: string[] = [];

    for (const block of replBlocks) {
        for (const line of block.lines) {
            const m = line.match(re);
            if (m) {
                codeLines.push(m[1]);
            }
        }
        // End block with a '#SECTION' comment to allow us to partition the
        // Shell output.
        codeLines.push('#SECTION');
    }
    return codeLines;
}

async function runScript(scriptLines: string[]): Promise<string[]> {
    // TODO: pull executable name and args from markdown file
    const outputText = await scriptHandshake(
        'node.exe',
        [
            'build/samples/repl.js',
            '-x',
            '-d=..\\shortorder\\samples\\menu',
        ],
        '% ',
        scriptLines
    );

    const outputLines = outputText.map(stripAnsi);

    return outputLines;
}

function makeOutputSections(lines: string[]) {
    const outputSections: string[][] = [];
    let currentSection: string[] = [];
    for (const line of lines) {
        if (line.includes('#SECTION')) {
            trimTrailingBlankLines(currentSection);
            outputSections.push(currentSection);
            currentSection = [];
        } else {
            currentSection.push(line);
        }
    }
    // NOTE: it's ok that we're dropping the last section because it is just
    // the output from the REPL shutting down at the end of input.

    return outputSections;
}

function trimTrailingBlankLines(lines: string[]) {
    // Remove trailing blank lines.
    while (lines.length > 1 && lines[lines.length - 1] === '') {
        lines.pop();
    }
}


// main();

// async function processFileOrFolder(
//     inPath: string,
//     outPath: string | undefined,
//     recursive: boolean
// ) {
//     // TODO: catch file not found (ENOENT)?
//     const inIsDir = fs.lstatSync(inPath).isDirectory();

//     if (outPath === undefined) {
//         if (inIsDir) {
//             outPath = inPath;
//         } else {
//             outPath = path.dirname(inPath);
//         }
//     }

//     const outIsDir = fs.lstatSync(outPath).isDirectory();

//     if (inIsDir && outIsDir) {
//         // Process all files from inDir to outDir.
//         let files: string[];
//         if (recursive) {
//             files = await recursiveReaddir(inPath);
//         } else {
//             files = fs.readdirSync(inPath);
//         }

//         for (const inFile of files) {
//             if (inFile.match(/\.src\.md$/)) {
//                 const outFile = rename(inFile, outPath);
//                 // console.log(`${inFile} => ${outFile}`);
//                 convertFile(inFile, outFile);
//             }
//         }
//     } else if (outIsDir) {
//         // Process one file from inDir to outDir
//         if (inPath.match(/\.src\.md$/)) {
//             const outFile = rename(inPath, outPath);
//             // console.log(`${inPath} => ${outFile}`);
//             convertFile(inPath, outFile);
//         } else {
//             const message = `File ${inPath} does not end in .src.md`;
//             throw new TypeError(message);
//         }
//     } else if (inIsDir) {
//         const message = `Cannot process directory ${
//             inPath
//         } to single output file ${
//             outPath
//         }`;
//         throw new TypeError(message);
//     } else {
//         // Process one file to another
//         const inFile = path.resolve(inPath);
//         const outFile = path.resolve(outPath);
//         convertFile(inPath, outFile);

//         // if (inFile === outFile) {
//         //     const message = `Input file cannot be the same as output file`;
//         //     throw new TypeError(message);
//         // }
//         // console.log(`${inFile} => ${outFile}`);
//     }
// }

// function convertFile(inFile: string, outFile: string) {
//     const inPath = path.resolve(inFile);
//     const outPath = path.resolve(outFile);

//     if (!inPath.match(/\.src\.md$/)) {
//         const message = `File ${inPath} does not end with .src.md`;
//         throw new TypeError(message);
//     }

//     if (outPath.match(/\.src\.md$/)) {
//         const message = `File ${outPath} cannot end with .src.md`;
//         throw new TypeError(message);
//     }

//     if (inPath === outPath) {
//         const message = `Input file ${inPath} cannot be the same as output file`;
//         throw new TypeError(message);
//     }

//     console.log(`Converting: ${inFile} => ${outFile}`);
// }

// // function processFolder(inFolder: string, outFolder: string, recursive: boolean) {

// // }

// function rename(fileName: string, outDir: string): string {
//     // console.log(`${filename}:`);
//     // console.log(`  resolved: ${path.resolve(filename)}`);
//     // console.log(`  dirname: ${path.dirname(filename)}`);
//     // console.log(`  basename: ${path.basename(filename)}`);
//     // console.log(`  extname: ${path.extname(filename)}`);

//     const baseName = path.basename(fileName);
//     const outFile = baseName.replace(/(\.src\.md)$/, '.md');
//     const outPath = path.join(outDir, outFile);

//     // console.log(`  outpath: ${outPath}`);

//     return outPath;
// }

// function go() {
//     // const paths = [
//     //     'd:\\git\\foobar\\test.src.md',
//     //     '~/mike/documentation.test.src.md',
//     //     'dir1/dir2/foo.test.md',
//     //     '/usr/tmp/foo.md',
//     //     'dir1/dir2/foo',
//     //     '../dir1/dir2/foo',
//     // ];

//     // for (const path of paths) {
//     //     rename(path, '/tmp/mike');
//     // }
//     processFileOrFolder('documentation/src', 'documentation', false);
//     processFileOrFolder('documentation/src', 'c:\\temp\\', false);
//     processFileOrFolder('documentation/src', undefined, false);
//     processFileOrFolder('documentation/src/repl.src.md', 'documentation', false);
//     // processFileOrFolder('documentation/repl.md', 'documentation', false);
// }

// go();
