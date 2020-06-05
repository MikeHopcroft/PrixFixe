import { PeekableSequence } from '../test_suite';

// https://stackoverflow.com/questions/4823468/comments-in-markdown

export enum CodeBlockType {
  REPAIR,
  REPL,
  SPAWN,
  VERBATIM,
  WARNING,
}

export interface CodeBlock {
  type: CodeBlockType;
  lines: string[];
}

export interface RepairBlock extends CodeBlock {
  type: CodeBlockType.REPAIR;
}

export interface ReplBlock extends CodeBlock {
  type: CodeBlockType.REPL;
}

export interface SpawnBlock extends CodeBlock {
  type: CodeBlockType.SPAWN;
  executable: string;
  args: string[];
}

export interface VerbatimBlock extends CodeBlock {
  type: CodeBlockType.VERBATIM;
}

export interface WarningBlock extends CodeBlock {
  type: CodeBlockType.WARNING;
}

export type AnyBlock =
  | RepairBlock
  | ReplBlock
  | SpawnBlock
  | VerbatimBlock
  | WarningBlock;

export function createBlock(info: string, lines: string[]): AnyBlock {
  const terms = info.trim().split(/\s+/);
  switch (terms[0]) {
    case 'repair': {
      const block: RepairBlock = {
        type: CodeBlockType.REPAIR,
        lines,
      };
      return block;
    }
    case 'repl': {
      const block: ReplBlock = {
        type: CodeBlockType.REPL,
        lines,
      };
      return block;
    }
    case 'spawn': {
      if (terms.length < 2) {
        const message = 'spawn: expected an executable name';
        throw new TypeError(message);
      }
      const executable = 'node';
      const args = terms.slice(1);
      const block: SpawnBlock = {
        type: CodeBlockType.SPAWN,
        executable,
        args,
        lines,
      };
      return block;
    }
    case 'verbatim': {
      const block: VerbatimBlock = {
        type: CodeBlockType.VERBATIM,
        lines,
      };
      return block;
    }
    case 'warning': {
      const block: WarningBlock = {
        type: CodeBlockType.WARNING,
        lines,
      };
      return block;
    }
    default:
      const message = `Unknown code block annotation "${terms[0]}"`;
      throw new TypeError(message);
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// parseMarkdown()
//
// Parses markdown file into interleaved sequence of text blocks and code
// blocks (delimited by ~~~).
//
///////////////////////////////////////////////////////////////////////////////
export function parseMarkdown(text: string): AnyBlock[] {
  const input = new PeekableSequence(text.split(/\r?\n/g).values());
  const blocks: AnyBlock[] = [];

  parseRoot();

  return blocks;

  function parseRoot() {
    let current = createBlock('verbatim', []);
    blocks.push(current);

    while (!input!.atEOS()) {
      const block = tryParseBlock();
      if (block) {
        blocks.push(block);
        current = createBlock('verbatim', []);
        blocks.push(current);
      } else {
        current.lines.push(input.get());
      }
    }
  }

  function tryParseBlock(): AnyBlock | null {
    const line = input.peek();
    const blockInfo = line.match(/\[\/\/\]:\s#\s\((.*)\)/);
    if (blockInfo) {
      input.get();
      if (input.peek() === '~~~') {
        return parseCode(line);
      } else {
        const message = `Expected code block after "${line}"`;
        throw new TypeError(message);
      }
    } else if (line === '~~~') {
      return parseCode();
    }

    return null;
  }

  function parseCode(header?: string): AnyBlock {
    const lines: string[] = [];

    if (header) {
      lines.push(header);
    }

    input.skip('~~~');
    lines.push('~~~');
    while (input.peek() !== '~~~') {
      lines.push(input.get());
    }
    lines.push('~~~');

    if (!input.skip('~~~')) {
      const message = 'Expected closing ~~~.';
      throw new TypeError(message);
    }

    if (header) {
      const blockInfo = header.match(/\[\/\/\]:\s#\s\((.*)\)/);
      if (!blockInfo) {
        const message = `Illegal block header "${header}"`;
        throw new TypeError(message);
      } else {
        return createBlock(blockInfo[1], lines);
      }
    } else {
      return createBlock('verbatim', lines);
    }
  }
}
