import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import stripAnsi = require('strip-ansi');

import { PeekableSequence } from '../test_suite';

///////////////////////////////////////////////////////////////////////////////
//
// scriptHandshake()
//
// REPL commands processing is asynchrnous. When dispatching commands from a
// script, the command output will often be interleaved. The code in
// scriptHandshake() waits for a prompt before dispatching the next command.
// This ensures that only one command is running at any time.
//
///////////////////////////////////////////////////////////////////////////////
function scriptHandshake(
    executable: string,
    args: string[],
    prompt: string,
    script: string[]
): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const program = spawn(executable, args);

        const iStream = program.stdin;
        const oStream = program.stdout;

        // Storage for strings from oStream's 'data' event.
        const fragments: string[] = [];

        // Position of next character to match in the prompt.
        // An undefined value means we're looking for the beginning of a line
        // before comparing with characters in the prompt.
        // Initialize to zero initially to allow prompts at the first
        // character position in the stream.
        let nextMatch: number | undefined = 0;

        // Index of the nextscript line to execute.
        let scriptLine = 0;

        function process(c: string) {
            if (c === '\n' || c === '\r') {
                // We're at the beginning of a line.
                // Start comparing with the first character of the prompt.
                nextMatch = 0;
            } else if (nextMatch !== undefined && c === prompt[nextMatch]) {
                nextMatch++;
                if (nextMatch === prompt.length) {
                    // We've encountered a prompt.
                    // Dispatch the next line in the script.
                    if (scriptLine < script.length) {
                        iStream.write(script[scriptLine++] + '\n');
                    } else {
                        iStream.end();
                    }

                    // Reset the state machine.
                    nextMatch = undefined;
                }
            } else {
                // Character didn't match pattern. Reset state machine.
                nextMatch = undefined;
            }
        }

        oStream.on('data', (data: Buffer) => {
            // TODO: REVIEW: BUGBUG: can a unicode codepoint be split across
            // two buffers?
            const text = data.toString('utf8');
            fragments.push(text);
            for (const c of text) {
                process(c);
            }
        });

        program.on('close', (code: number) => {
            const lines = fragments.join('').split(/\r?\n/g);
            const linesWithPrompts: string[] = [];
            let i = 0;
            for (const line of lines) {
                if (line.startsWith(prompt)) {
                    let text = script[i++];
                    if (text === '#') {
                        // Special case: a single character comment
                        // instructs the system to print out the prompt
                        // with no text afterwards.
                        text = '';
                    }
                    linesWithPrompts.push(`${prompt}${text}`);
                    linesWithPrompts.push(line.slice(prompt.length));
                } else {
                    linesWithPrompts.push(line);
                }
            }
            resolve(linesWithPrompts);
        });
    });
}

///////////////////////////////////////////////////////////////////////////////
//
// parseMarkdown()
//
// Parses markdown file into interleaved sequence of text blocks and code
// blocks (delimited by ~~~).
//
///////////////////////////////////////////////////////////////////////////////
function parseMarkdown(
    text: string
): { textBlocks: string[][]; codeBlocks: string[][] } {
    const input = new PeekableSequence(text.split(/\r?\n/g).values());
    const textBlocks: string[][] = [];
    const codeBlocks: string[][] = [];

    parseRoot();

    return {
        textBlocks,
        codeBlocks,
    };

    function parseRoot() {
        while (!input!.atEOS()) {
            parseTextBlock();
        }
    }

    function parseTextBlock() {
        const textBlock: string[] = [];
        let lastLine = '';
        while (!input.atEOS()) {
            if (input.peek() === '~~~') {
                const block = parseCodeBlock();
                if (lastLine !== '[//]: # (repl)') {
                    textBlock.push('~~~');
                    for (const line of block) {
                        textBlock.push(line);
                    }
                    textBlock.push('~~~');
                    lastLine = '';
                } else {
                    codeBlocks.push(block);
                    break;
                }
            } else {
                lastLine = input.get();
                textBlock.push(lastLine);
            }
        }
        textBlocks.push(textBlock);
    }

    function parseCodeBlock(): string[] {
        const lines: string[] = [];

        input.skip('~~~');
        while (!input.atEOS() && input.peek() !== '~~~') {
            lines.push(input.get());
        }

        if (!input.skip('~~~')) {
            const message = 'Expected closing ~~~.';
            throw new TypeError(message);
        }

        return lines;
    }
}

async function updateMarkdown(text: string) {
    // Split markdown into alternating text block and code sections.
    const { textBlocks, codeBlocks } = parseMarkdown(text);

    // Make a script by extracting shell input from code blocks.
    const scriptLines = makeScript(codeBlocks);

    // Run the script to gather new output.
    const outputLines = await runScript(scriptLines);

    // Break the output into sections corresponding to code blocks.
    const outputSections = makeOutputSections(outputLines);

    // Finally, zip together the original text blocks and the new code blocks
    const finalLines = interleaveTextAndCodeBlocks(textBlocks, outputSections);
    // const finalText = finalLines.join('');
    const finalText = finalLines.join('\n');

    return finalText;
}

function makeScript(codeBlocks: string[][]) {
    const re = /%\s(.*)/;
    const codeLines: string[] = [];

    for (const block of codeBlocks) {
        for (const line of block) {
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
            // '../shortorder/build/samples/repl.js',
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

function interleaveTextAndCodeBlocks(
    textBlocks: string[][],
    codeBlocks: string[][]
) {
    const finalLines: string[] = [];
    for (let i = 0; i < textBlocks.length; ++i) {
        for (const line of textBlocks[i]) {
            finalLines.push(line);
        }
        if (i < codeBlocks.length) {
            finalLines.push('~~~');
            for (const line of codeBlocks[i]) {
                finalLines.push(line);
            }
            finalLines.push('~~~');
        }
    }
    return finalLines;
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
    fs.writeFileSync(outFile, updatedText, 'utf8');

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
