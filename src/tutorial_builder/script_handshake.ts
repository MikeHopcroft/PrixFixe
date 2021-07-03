import { spawn } from 'child_process';

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
export function scriptHandshake(
  executable: string,
  args: string[],
  prompt: string,
  script: string[]
): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          // Reset the state machine.
          nextMatch = 0;

          // Dispatch the next line in the script.
          if (scriptLine < script.length) {
            iStream.write(script[scriptLine++] + '\n');
          } else {
            iStream.end();
          }
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
