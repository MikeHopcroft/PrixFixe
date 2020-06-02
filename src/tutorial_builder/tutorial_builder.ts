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

export async function updateMarkdown(
    nameToSKU: Map<string, number>,
    text: string
) {
    let blocks = parseMarkdown(text);

    blocks = processRepair(nameToSKU, blocks);
    blocks = await processRepl(blocks);
    blocks = await processSpawn(blocks);
    blocks = processWarnings(blocks);

    return combine(blocks);
}

function processRepair(
    nameToSKU: Map<string, number>,
    blocks: AnyBlock[]
): AnyBlock[] {
    const re = /(\s*\d+\s+(.+)\s+\()(\d+(?:\.\d+)?)(\)\s*)/;

    function replacer(
        match: string,
        left: string,
        name: string,
        sku: string,
        right: string
    ) {
        const newSKU = nameToSKU.get(name);
        if (!newSKU) {
            const message = `Unknown product "${name}"`;
            throw new TypeError(message);
        }
        if (sku !== newSKU.toString()) {
            console.log(`${name}: ${sku} => ${newSKU}`);
        }
        return left + newSKU + right;
    }

    return blocks.map(block => {
        if (block.type === CodeBlockType.REPAIR) {
            const lines = block.lines.map((line, i) => {
                if (i < 2 || i === block.lines.length - 1) {
                    return line;
                } else {
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
            if (
                i === 0 &&
                replBlocks[i].lines.length >= 3 && 
                replBlocks[i].lines[2].startsWith('$')
            ) {
                // First block starts with command to invoke repl.
                return createBlock(
                    'verbatim',
                    [
                        '~~~',
                        replBlocks[i].lines[2],
                        ...outputSections[i++],
                        '~~~',
                    ]
                );
            } else {
                const s = outputSections[i];
                return createBlock(
                    'verbatim',
                    ['~~~', ...outputSections[i++], '~~~']
                );
            }
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

function processWarnings(blocks: AnyBlock[]): AnyBlock[] {
    return blocks.map(block => {
        if (block.type === CodeBlockType.WARNING) {
            console.log(`WARNING: the following block may need manual fixup:`);
            for (const line of block.lines) {
                console.log('  ' + line);
            }
            return createBlock('verbatim', block.lines);
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
            outputSections.push(currentSection);
            currentSection = [];
        } else {
            currentSection.push(line);
        }
    }

    for (const section of outputSections) {
        trimLeadingBlankLines(section);
        trimTrailingBlankLines(section);
    }

    // NOTE: it's ok that we're dropping the last section because it is just
    // the output from the REPL shutting down at the end of input.

    return outputSections;
}

function trimLeadingBlankLines(lines: string[]) {
    // Remove trailing blank lines.
    while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
    }
}

function trimTrailingBlankLines(lines: string[]) {
    // Remove trailing blank lines.
    while (lines.length > 1 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }
}
