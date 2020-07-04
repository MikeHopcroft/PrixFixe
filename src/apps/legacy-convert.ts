import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as minimist from 'minimist';
import * as path from 'path';

import { ICatalog } from '../core/catalog';
import { createWorld } from '../processors';

import { TestLineItem } from '../test_suite';

import {
  fail,
  GenericCase,
  GenericSuite,
  handleError,
  LogicalCart,
  LogicalItem,
  succeed,
  TextTurn,
  ValidationStep,
} from '../core/test_suite2';

import { writeYAML } from '../test_suite2';

interface LegacyCase {
  priority: number;
  suites: string;
  comment: string;
  inputs: string[];
  expected: Array<{
    lines: TestLineItem[];
  }>;
}

type LegacySuite = LegacyCase[];

function main() {
  dotenv.config();

  const args = minimist(process.argv.slice(2));

  if (args.h || args.help) {
    showUsage();
    return succeed(false);
  }

  if (args._.length !== 2) {
    return fail('Error: expected command line two parameters.');
  }

  const inFile = args._[0];
  const outFile = args._[1];

  let dataPath = process.env.PRIX_FIXE_DATA;
  if (args.d) {
    dataPath = args.d;
  }
  if (dataPath === undefined) {
    const message =
      'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
    return fail(message);
  }

  try {
    convertLegacyTestSuiteFile(inFile, outFile, dataPath);
  } catch (e) {
    handleError(e);
  }
}

function convertLegacyTestSuiteFile(
  inFile: string,
  outFile: string,
  dataPath: string
) {
  console.log('Converting');
  console.log(`  from legacy test suite: ${inFile}`);
  console.log(`  to output file: ${outFile}`);
  console.log(`With data path = ${dataPath}`);
  console.log('');

  // Load the world, which provides the ICatalog.
  const world = createWorld(dataPath);

  // Load the legacy test suite.
  console.log(`Reading legacy suite from ${inFile}`);
  const yamlTextIn = fs.readFileSync(inFile, 'utf8');
  const legacySuite = yaml.safeLoad(yamlTextIn) as LegacySuite;

  // Perform the conversion to GenericCase<ValidationStep<TextTurn>>[]
  const suite = convertLegacyTestSuite(legacySuite, world.catalog);

  console.log(`Writing converted suite to ${outFile}`);
  writeYAML(outFile, suite);

  console.log('Conversion complete');
  return succeed(true);
}

function showUsage() {
  const program = path.basename(process.argv[1]);

  const usage: Section[] = [
    {
      header: 'Legacy test suite converter',
      content: `This utility converts legacy format test suite YAML files to the format used by test_suite2.`,
    },
    {
      header: 'Usage',
      content: [`node ${program} <legacy file> <output file> [...options]`],
    },
    {
      header: 'Options',
      optionList: [
        {
          name: 'd',
          alias: 'd',
          description: `Path to prix-fixe data files.\n
                - attributes.yaml
                - cookbook.yaml
                - intents.yaml
                - options.yaml
                - products.yaml
                - quantifiers.yaml
                - rules.yaml
                - stopwords.yaml
                - units.yaml\n
                The {bold -d} flag overrides the value specified in the {bold PRIX_FIXE_DATA} environment variable.\n`,
          type: Boolean,
        },
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

function convertLegacyTestSuite(
  legacySuite: LegacySuite,
  catalog: ICatalog
): GenericSuite<ValidationStep<TextTurn>> {
  const convertLegacyCase = (
    legacy: LegacyCase,
    id: number
  ): GenericCase<ValidationStep<TextTurn>> => {
    const steps: Array<ValidationStep<TextTurn>> = [];
    for (let i = 0; i < legacy.inputs.length; ++i) {
      const cart: LogicalCart = convertLegacyCart(
        legacy.expected[i].lines,
        catalog
      );
      steps.push({
        turns: [
          {
            speaker: 'employee',
            transcription: legacy.inputs[i],
          },
        ],
        cart,
      });
    }

    return {
      id,
      suites: legacy.suites,
      comment: legacy.comment,
      steps,
    };
  };

  const tests = legacySuite.map(convertLegacyCase);
  return { tests };
}

function convertLegacyCart(
  legacyItems: TestLineItem[],
  catalog: ICatalog
): LogicalCart {
  const items: LogicalItem[] = [];
  for (const legacyItem of legacyItems) {
    const specificItem = catalog.getSpecific(legacyItem.key);

    const item: LogicalItem = {
      quantity: legacyItem.quantity,
      // Use name from menu instead of legacyItem.
      name: specificItem.name,
      sku: specificItem.sku.toString(),
      children: [],
    };
    if (legacyItem.indent === 0) {
      items.push(item);
    } else {
      items[items.length - 1].children.push(item);
    }
  }

  return { items };
}

main();
