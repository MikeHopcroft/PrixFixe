import { spawnSync } from 'child_process';
import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import stripAnsi = require('strip-ansi');

import {
    AnyBlock,
    CodeBlockType,
    createBlock,
    parseMarkdown,
    ReplBlock,
} from './markdown_parser';

import { scriptHandshake } from './script_handshake';

async function updateMarkdown(text: string) {
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

async function main() {
    // TODO: get executable and params (e.g. -d, -x) from markdown
    const args = minimist(process.argv.slice(2));

    if (args.h || args.help) {
        showUsage();
        return succeed(false);
    }

    const inFile = args._[0];
    let outFile = args._[1];

    if (!inFile) {
        const message = 'Expected an <input file>.';
        return fail(message, true);
    }

    const originalFile = path.resolve(inFile);
    if (!fs.existsSync(originalFile)) {
        const message = `Cannot find file ${originalFile}.`;
        return fail(message, false);
    }

    if (!outFile) {
        outFile = path.join(
            path.dirname(originalFile),
            path.basename(originalFile, path.extname(originalFile)) + '.out.md'
        );
    }

    // // Backup original file.
    // const backupFile = originalFile + '.old';
    // console.log(`Copying ${originalFile} to ${backupFile}.`);
    // fs.copyFileSync(originalFile, backupFile);

    // console.log(`Updating from ${backupFile} to ${originalFile}.`);
    // const text = fs.readFileSync(backupFile, 'utf8');

    const text = fs.readFileSync(originalFile, 'utf8');
    const updatedText = await updateMarkdown(text);
    // fs.writeFileSync(originalFile, updatedText, 'utf8');

    console.log(`Writing to ${outFile}`);
    // console.log(updatedText);
    // fs.writeFileSync(outFile, updatedText, 'utf8');

    console.log('=======================================');
    console.log(updatedText);

    return succeed(true);
}

function showUsage() {
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
        {
            header: 'Tutorial Builder',
            content:
                'This utility uses a markdown file as a template for ' +
                'generating documentation by rerunning commands inside of ' +
                'markdown code blocks.',
        },
        {
            header: 'Usage',
            content: [
                `node ${program} <input file> [output file] [...options]`,
            ],
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'help',
                    alias: 'h',
                    description: 'Print help message',
                    type: Boolean,
                },
            ],
        },
    ];

    console.log(commandLineUsage(usage));
}

function fail(message: string, displayUsage = false) {
    console.log(' ');
    console.log(message);

    if (displayUsage) {
        showUsage();
    } else {
        console.log('Use the -h flag for help.');
    }
    console.log(' ');
    console.log('Aborting');
    console.log(' ');
    process.exit(1);
}

export function succeed(succeeded: boolean) {
    if (succeeded) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

main();
