import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import stripAnsi = require('strip-ansi');
// import * as stream from 'stream';

import { PeekableSequence } from "../test_suite";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// class Handshake {
//     iStream: stream.Writable;
//     oStream: stream.Readable;
//     prompt: string;
//     script: string[];

//     fragments: string[] = [];

//     // Position of next character to match in the prompt.
//     // An undefined value means we're looking for the beginning of a line
//     // before comparing with characters in the prompt.
//     // Initialize to zero initially to allow prompts at the first
//     // character position in the stream.
//     nextMatch: number | undefined = 0;

//     // Index of the nextscript line to execute.
//     scriptLine = 0;

//     constructor(
//         iStream: stream.Writable,
//         oStream: stream.Readable,
//         prompt: string,
//         script: string[]
//     ) {
//         this.iStream = iStream;
//         this.oStream = oStream;
//         this.prompt = prompt;
//         this.script = script;

//         const self = this;

//         oStream.on('data', (data: Buffer) => {
//             // TODO: REVIEW: can a unicode codepoint be split across two
//             // buffers?
//             const text = data.toString('utf8');
//             this.fragments.push(text);
//             for (const c of text) {
//                 self.process(c);
//             }
//         });
//     }

//     process(c: string) {
//         if (this.nextMatch === undefined) {
//             if (c === '\n') {
//                 // We're at the beginning of a line.
//                 // Start comparing with the first character of the prompt.
//                 this.nextMatch = 0;
//             }
//         } else if (c === this.prompt[this.nextMatch]) {
//             this.nextMatch++;
//             if (this.nextMatch === this.prompt.length) {
//                 // We've encountered a prompt.
//                 // Dispatch the next line in the script.
//                 if (this.scriptLine < this.script.length) {
//                     this.iStream.write(this.script[this.scriptLine++]);
//                 }

//                 // Reset the state machine.
//                 this.nextMatch = undefined;
//             }
//         } else {
//             // Character didn't match patter. Reset state machine.
//             this.nextMatch = undefined;
//         }
//     }
// }

// class Handshake {
//     iStream: stream.Writable;
//     oStream: stream.Readable;
//     prompt: string;
//     script: string[];

//     fragments: string[] = [];

//     // Position of next character to match in the prompt.
//     // An undefined value means we're looking for the beginning of a line
//     // before comparing with characters in the prompt.
//     // Initialize to zero initially to allow prompts at the first
//     // character position in the stream.
//     nextMatch: number | undefined = 0;

//     // Index of the nextscript line to execute.
//     scriptLine = 0;

function handshake(
    // iStream: stream.Writable,
    // oStream: stream.Readable,
    program: ChildProcessWithoutNullStreams,
    prompt: string,
    script: string[]
): Promise<string[]> {
    return new Promise<string[]>( (resolve, reject) => {
        const iStream = program.stdin;
        const oStream = program.stdout;

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
            // console.log(`process(${c})`);
            // if (nextMatch === undefined) {
            if (c === '\n' || c === '\r') {
                // We're at the beginning of a line.
                // Start comparing with the first character of the prompt.
                nextMatch = 0;
                // }
            } else if (nextMatch !== undefined && c === prompt[nextMatch]) {
                // console.log(`match(${c})`);
                nextMatch++;
                if (nextMatch === prompt.length) {
                    // We've encountered a prompt.
                    // Dispatch the next line in the script.
                    if (scriptLine < script.length) {
                        // console.log(`dispatch "${script[scriptLine]}`);
                        iStream.write(script[scriptLine++] + '\n');
                    } else {
                        iStream.end();
                    }

                    // Reset the state machine.
                    nextMatch = undefined;
                }
            } else {
                // Character didn't match patter. Reset state machine.
                nextMatch = undefined;
            }
        }

        oStream.on('data', (data: Buffer) => {
            // TODO: REVIEW: can a unicode codepoint be split across two
            // buffers?
            const text = data.toString('utf8');
            // console.log(`stdout: "${text}"`);
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
                    linesWithPrompts.push(`${prompt}${script[i++]}`);
                } else {
                    linesWithPrompts.push(line);
                }
            }
            resolve(linesWithPrompts);
        });
    });
}



class Parser {
    textBlocks: string[][] = [];
    codeBlocks: string[][] = [];
    input: PeekableSequence<string> | undefined;

    constructor(text: string) {
    }

    parse(text: string): { textBlocks: string[][], codeBlocks: string[][] } {
        this.input = new PeekableSequence(text.split(/\r?\n/g).values());
        this.textBlocks = [];
        this.codeBlocks = [];

        this.parseRoot();

        return {
            textBlocks: this.textBlocks,
            codeBlocks: this.codeBlocks,
        };
    }

    parseRoot() {
        while (!this.input!.atEOS()) {
            this.parseTextBlock();
        }
    }

    parseTextBlock() {
        const textBlock: string[] = [];
        const input = this.input!;
        let lastLine = '';
        while (!input.atEOS()) {
            if (input.peek() === '~~~') {
                const block = this.parseCodeBlock();
                if (lastLine !== '[//]: # (shell)') {
                    textBlock.push('~~~');
                    for (const line of block) {
                        textBlock.push(line);
                    }
                    textBlock.push('~~~');
                    lastLine = '';
                } else {
                    this.codeBlocks.push(block);
                    break;
                }
            } else {
                lastLine = input.get();
                textBlock.push(lastLine);
            }
        }
        this.textBlocks.push(textBlock);
    }

    parseCodeBlock(): string[] {
        const lines: string[] = [];

        const input = this.input!;
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
    const parser = new Parser(text);
    const { textBlocks, codeBlocks } = parser.parse(text);

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
    // TODO: pull executable from markdown file
    const outputText = await run(
        'node.exe',
        ['../shortorder/build/samples/repl.js',
         '-x',
         '-d=..\\shortorder\\samples\\menu',
        ],
        '% ',
        scriptLines
    );

    // Group the captured output into code block sections.
    // const outputLines = stripAnsi(outputText).split(/\r?\n/g);

    const outputLines = outputText.map(stripAnsi);
    // const outputLines = outputText;

    return outputLines;
}

function run(
    executable: string,
    args: string[],
    prompt: string,
    script: string[]
): Promise<string[]> {
    const program = spawn(executable, args);
    return handshake(program, prompt, script);
    // return new Promise<string[]>(async (resolve, reject) => {
    //     const program = spawn(executable, args);


    //     for (const line of script) {
    //         await sleep(1000);
    //         program.stdin.write(line + '\n', 'utf8');
    //     }

    //     // TODO: make exit command configurable.
    //     // Write blank line to exit repl.
    //     program.stdin.write('\n');

    //     const output: string[] = [];
    //     program.stdout.on('data', (data: Buffer) => {
    //         // console.log(`STDOUT: ${data}`);
    //         output.push(data.toString('utf8'));
    //     });

    //     program.stderr.on('data', (data: Buffer) => {
    //         console.error(`stderr: ${data.toString('utf8')}`);

    //         // TODO: should we capture stderr output?
    //     });

    //     program.on('close', (code: number) => {
    //         console.log(`child process exited with code ${code}`);

    //         // const chunks = output.join('').split(prompt);
    //         const lines = output.join('').split(/\r?\n/g);
    //         const complete: string[] = [];
    //         let i = 0;
    //         for (const line of lines) {
    //             if (line.startsWith(prompt)) {
    //                 complete.push(`${prompt}${script[i++]}`);
    //             } else {
    //                 complete.push(line);
    //             }
    //         }
    //         resolve(complete);
    //     });
    // });
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
    // the Shell shutting down at the end of input.

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

function usage() {
    // TODO: implement
    console.log('TBD: show usage here');
}

async function main() {

    // TODO: use minimist for args.
    // TODO: -d argument
    // TODO: -x argument
    // TODO: app.fail(), app.exit()
    // TODO: -h, usage()

    if (process.argv.length !== 3) {
        usage();
        return 1;
    }

    const originalFile = path.resolve(process.argv[2]);
    if (!fs.existsSync(originalFile)) {
        console.log(`Cannot find file ${originalFile}.`);
        return 1;
    }

    const outfile = path.join(
        path.dirname(originalFile),
        path.basename(originalFile, path.extname(originalFile)) + '.out.md');

    // // Backup original file.
    // const backupFile = originalFile + '.old';
    // console.log(`Copying ${originalFile} to ${backupFile}.`);
    // fs.copyFileSync(originalFile, backupFile);

    // console.log(`Updating from ${backupFile} to ${originalFile}.`);
    // const text = fs.readFileSync(backupFile, 'utf8');

    const text = fs.readFileSync(originalFile, 'utf8');
    const updatedText = await updateMarkdown(text);
    // fs.writeFileSync(originalFile, updatedText, 'utf8');

    console.log(`Writing to ${outfile}`);
    // fs.writeFileSync(outfile, updatedText, 'utf8');

    console.log('=======================================');
    console.log(updatedText);

    return 0;
}

main();
