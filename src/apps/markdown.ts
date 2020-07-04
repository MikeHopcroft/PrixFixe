import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';

import {
  CombinedTurn,
  fail,
  handleError,
  renderSuiteAsMarkdown,
  succeed,
} from '../core/test_suite2';

import { loadLogicalValidationSuite } from '../test_suite2'

function main() {
  dotenv.config();

  const args = minimist(process.argv.slice(2));

  if (args.h || args.help) {
    showUsage();
    return succeed(false);
  }

  if (args._.length !== 2) {
    return fail('Error: expected two command line parameters.');
  }

  const inFile = args._[0];
  const outFile = args._[1];

  try {
    console.log(`Reading suite from ${inFile}.`);
    const inputSuite = loadLogicalValidationSuite<CombinedTurn>(inFile);

    const lines = renderSuiteAsMarkdown(inputSuite);

    console.log(`Writing markdown to ${outFile}.`);
    fs.writeFileSync(outFile, lines);
  } catch (e) {
    handleError(e);
  }

  console.log('Markdown generation complete.');
  return succeed(true);
}

function showUsage() {
  const program = path.basename(process.argv[1]);

  const usage: Section[] = [
    {
      header: 'Format test suite as markdown',
      content: `This utility formats a test suite as markdown.`,
    },
    {
      header: 'Usage',
      content: [`node ${program} <input file> <output file>`],
    },
  ];

  console.log(commandLineUsage(usage));
}

main();
