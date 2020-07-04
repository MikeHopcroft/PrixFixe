import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as recursiveReaddir from 'recursive-readdir';

import { Processor, State } from '../core/processors';

import {
  enumerateTestCases,
  filterSuite,
  formatScoredSuite,
  FormatScoredSuiteOptions,
  mapSuiteAsync,
  suitePredicateFilter,
} from '../core/test_suite2';

import { World } from '../core/world';

import { createWorld2 } from '../processors';
import { suitePredicate, TestProcessors } from '../test_suite';


import {
  AnyTurn,
  GenericCase,
  GenericSuite,
  LogicalValidationSuite,
  ScoredStep,
  TextTurn,
  ValidationStep,
  LogicalScoredSuite,
} from '../core/test_suite2/interfaces';

import {
  loadLogicalScoredSuite,
  loadLogicalValidationSuite,
  writeYAML,
} from './loaders';

import { logicalCartFromCart } from '../core/test_suite2/logical_cart';
import { createMenuBasedRepairFunction } from '../core/test_suite2/repair_functions';
import { scoreSuite } from '../core/test_suite2/scoring';

export async function testRunnerMain2(
  title: string,
  processorFactory: TestProcessors
) {
  const app = new Application(processorFactory);

  dotenv.config();

  console.log(`${title} test runner`);
  console.log(new Date().toLocaleString());

  //
  // Validate command-line arguments.
  //

  const args = minimist(process.argv.slice(2));

  // NOTE: must check for help before other flags as an error related to a
  // flag value might cause an early fail that would prevent showing the
  // help message.
  if (args.h || args.help || args['?']) {
    app.showUsage();
    app.exit(0);
  }

  let dataPath = process.env.PRIX_FIXE_DATA;
  if (args.d) {
    dataPath = args.d;
  }
  if (dataPath === undefined) {
    const message =
      'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
    return app.fail(message);
  }
  console.log(`data path = ${dataPath}`);

  const baselineFile = args.baseline;
  const showDetails = args.details === 'false' ? false : true;
  const dryRunMode = args.dryrun === true;
  // const markdown = args['m'] === true;

  let testId: number | undefined;
  if (args.n) {
    testId = Number(args.n);
    if (Number.isNaN(testId)) {
      const message = 'Expected test number after -n flag.';
      app.fail(message);
    }
  }

  const processorName = args.p;
  const recursive = args.r === true;
  const suiteExpressionText = args.s;

  const input = args._[0];
  const outputFile = args._[1];

  if (input === undefined) {
    const message = 'Expected YAML input file or directory on command line.';
    return app.fail(message, true);
  }

  // Generate list of input files. The `input` parameter is either the name
  // of a single test suite file or a directory containing a set of test
  // suite files. Load these files and combine into a single test suite.
  const testFiles = await findTestSuites(input, recursive);
  let suite = loadAndCombineTestSuites(app, input, testFiles);

  // Filter suite by test case id or suite expression, if specified.
  suite = filterTestSuites(app, suite, testId, suiteExpressionText);

  if (dryRunMode) {
    // In brief mode, don't actually run the tests.
    // Just display the input text.
    displayBriefView(suite);
    console.log('Tests not run.');
    console.log('Exiting with failing return code.');
    return app.exit(1);
  } else {
    // Run the tests in the suite.
    const scored = await runTests(
      app,
      dataPath,
      processorFactory,
      processorName,
      suite
    );

    // Display results.
    const lines: string[] = [];
    const options: FormatScoredSuiteOptions = {
      showDetails,
      showPassing: args.a === true || args.n,
      showFailing: true,
      showBySuite: true,
      showMeasures: args.n ? false : true,
    };

    formatScoredSuite(lines, scored, options);
    for (const line of lines) {
      console.log(line);
    }

    // Write results to outputFile, if specified.
    if (outputFile) {
      console.log(`Writing to "${outputFile}"`);
      writeYAML(outputFile, scored);
    }

    if (baselineFile) {
      console.log(`Baseline: "${baselineFile}"`);
      console.log(' ');
      const baseline = loadLogicalScoredSuite(baselineFile);
      compareScoredSuites(baseline, scored);
    }

    // Successful exit.
    return app.exit(0);
  }
}

async function findTestSuites(
  input: string,
  recursive: boolean
): Promise<string[]> {
  let testFiles: string[];
  if (fs.lstatSync(input).isDirectory()) {
    console.log(`Searching for test suites in ${input}`);

    let files;
    if (recursive) {
      files = await recursiveReaddir(input);
    } else {
      files = fs.readdirSync(input);
    }

    testFiles = files
      .sort()
      .filter(f => f.endsWith('yaml') || f.endsWith('yml'))
      .map(f => path.resolve(input, f));
  } else {
    // Assume that input is a YAML test file.
    testFiles = [input];
  }

  console.log(`Test files:`);
  for (const file of testFiles) {
    console.log(`  ${file}`);
  }

  return testFiles;
}

function loadAndCombineTestSuites(
  app: Application,
  input: string,
  testFiles: string[]
) {
  let suite: GenericSuite<ValidationStep<TextTurn>>;
  try {
    if (testFiles.length === 1) {
      const testFile = testFiles[0];
      console.log(`Reading ${testFile}`);
      suite = loadLogicalValidationSuite(testFile);
    } else {
      // Suite is the combination of a number of suites..
      suite = {
        comment: `Combination of ${input}/*.yaml`,
        tests: [],
      };
      for (const testFile of testFiles) {
        console.log(`Reading ${testFile}`);
        const s: LogicalValidationSuite<TextTurn> = loadLogicalValidationSuite(
          testFile
        );
        suite.tests.push({
          comment: testFile,
          tests: [s],
        });
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') {
      const message = `Cannot open test file "${err.path}"`;
      app.fail(message);
    }
    throw err;
  }

  return suite;
}

function filterTestSuites(
  app: Application,
  suite: GenericSuite<ValidationStep<TextTurn>>,
  testId: number | undefined,
  suiteExpressionText: string | undefined
): GenericSuite<ValidationStep<TextTurn>> {
  if (testId !== undefined) {
    console.log(`Running test with id=${testId}.`);
    suite = filterSuite(suite, test => testId === test.id);
  } else if (suiteExpressionText) {
    console.log(
      `Running tests matching suite expression: ${suiteExpressionText}`
    );
    const suiteExpression = suitePredicate(suiteExpressionText);
    suite = filterSuite(suite, suitePredicateFilter(suiteExpression));
  } else {
    console.log('Running all tests.');
  }
  return suite;
}

function displayBriefView(suite: GenericSuite<ValidationStep<TextTurn>>) {
  console.log(' ');
  console.log('Displaying test utterances without running.');
  for (const test of enumerateTestCases(suite)) {
    console.log(`Test ${test.id}: ${test.comment}`);
    for (const [i, step] of test.steps.entries()) {
      console.log(`  Step ${i}`);
      for (const turn of step.turns) {
        console.log(`    ${turn.speaker}: ${turn.transcription}`);
      }
    }
    console.log(' ');
  }
}

async function runTests(
  app: Application,
  dataPath: string,
  processorFactory: TestProcessors,
  verify: string | undefined,
  suite: GenericSuite<ValidationStep<TextTurn>>
): Promise<LogicalScoredSuite<AnyTurn>> {
  //
  // Load the menu.
  //
  let world: World;
  try {
    world = createWorld2(dataPath);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') {
      const message = `Create world failed: cannot open "${err.path}"`;
      app.fail(message);
    }
    throw err;
  }

  //
  // Set up short-order processor.
  //
  if (processorFactory.count() === 0) {
    const message = `ProcessorFactory must contain at least one ProcessorDescription.`;
    app.fail(message);
  }

  let processor: Processor;
  if (verify) {
    if (!processorFactory.has(verify)) {
      const message = `Unknown processor v=${verify}`;
      app.fail(message);
    }
    processor = processorFactory.create(verify, world, dataPath);
    console.log(`processor = ${verify}`);
  } else {
    const description = processorFactory.getDefault();
    processor = description.create(world, dataPath);
    console.log(`processor = ${description.name}`);
  }

  console.log(' ');

  //
  // Run each test case.
  //
  const observed = await mapSuiteAsync(suite, async test => {
    let state: State = { cart: { items: [] } };
    const steps: typeof test.steps = [];
    for (const step of test.steps) {
      for (const turn of step.turns) {
        try {
          state = await processor(turn.transcription, state);
        } catch (e) {
          // TODO: record the error here, somehow.
        }
      }
      const cart = logicalCartFromCart(state.cart, world.catalog);
      steps.push({ ...step, cart });
    }
    return { ...test, steps };
  });

  //
  // Score the results
  //
  const repairFunction = createMenuBasedRepairFunction(
    world.attributeInfo,
    world.catalog
  );
  const scored = scoreSuite(observed, suite, repairFunction, 'menu-based');

  return scored;
}

function compareScoredSuites(
  baseline: LogicalScoredSuite<AnyTurn>,
  current: LogicalScoredSuite<AnyTurn>
) {
  let bp = 0;
  let cp = 0;
  let missingTests = 0;
  let newTests = 0;

  const bIdToTest = new Map<number, GenericCase<ScoredStep<AnyTurn>>>();
  for (const test of enumerateTestCases(baseline)) {
    bIdToTest.set(test.id, test);
  }

  const cIdToTest = new Map<number, GenericCase<ScoredStep<AnyTurn>>>();
  for (const test of enumerateTestCases(current)) {
    cIdToTest.set(test.id, test);
  }

  for (const b of bIdToTest.values()) {
    const br = b.steps.reduce((p, c) => p + c.measures.repairs!.cost, 0);
    if (br === 0) {
      bp++;
    }
    const bText = br === 0 ? 'OK' : `FAILED(${br})`;

    const c = cIdToTest.get(b.id);
    if (c) {
      const cr = c.steps.reduce((p, c) => p + c.measures.repairs!.cost, 0);
      if (cr === 0) {
        cp++;
      }
      const cText = cr === 0 ? 'OK' : `FAILED(${cr})`;

      if (br !== cr) {
        console.log(`${b.id}: ${bText} => ${cText}`);
      }
    } else {
      ++missingTests;
      console.log(`${b.id}: REMOVED(${bText})`);
    }
  }

  for (const c of cIdToTest.values()) {
    const b = bIdToTest.get(c.id);
    if (!b) {
      ++newTests;
      const cr = c.steps.reduce((p, c) => p + c.measures.repairs!.cost, 0);
      const cText = cr === 0 ? 'OK' : `FAILED(${cr})`;
      console.log(`${c.id}: NEW(${cText})`);
    }
  }

  console.log(' ');
  console.log(`Baseline passing tests: ${bp}`);
  console.log(`Current passing tests: ${cp}`);
  console.log(`Delta: ${cp - bp}`);

  console.log(' ');
  console.log(`Missing tests: ${missingTests}`);
  console.log(`New tests: ${newTests}`);
}

class Application {
  private readonly processorFactory: TestProcessors;

  constructor(processorFactory: TestProcessors) {
    this.processorFactory = processorFactory;
  }

  showUsage() {
    const defaultProcessor = this.processorFactory.getDefault().name;
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
      {
        header: 'Test Runner',
        content: `This utility allows the user to run text utterances to verify intermediate and final cart states using a YAML test case file.`,
      },
      {
        header: 'Usage',
        content: [
          `node ${program} <file|directory> [output file] [...options]`,
          '',
          `Where <file> is the name of a single YAML test suite file and <directory> is a directory of YAML test suite files.`,
        ],
      },
      {
        header: 'Options',
        optionList: [
          {
            name: 'a',
            alias: 'a',
            type: Boolean,
            description: 'Print results for all tests, passing and failing.',
          },
          {
            name: 'baseline',
            typeLabel: '{underline file}',
            description: 'Compare with ScoredSuite baseline.',
          },
          {
            name: 'details',
            type: Boolean,
            description: 'Print test case details. Defaults to true',
          },
          {
            name: 'dryrun',
            type: Boolean,
            description:
              'Dryrun mode - just print utterances. Do not run tests.',
          },
          {
            name: 'd',
            alias: 'd',
            description: `Path to prix-fixe data files.\n
                                        - attributes.yaml
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
          // {
          //     name: 'm',
          //     alias: 'm',
          //     type: Boolean,
          //     description: 'Print out test run, formatted as markdown.',
          // },
          {
            name: 'n',
            alias: 'n',
            typeLabel: '{underline N}',
            description:
              'Run the test case with id={underline N}. ' +
              'Note that the -n flag overrides the -s flag.',
          },
          // {
          //   name: 'output',
          //   alias: 'o',
          //   typeLabel: '{underline output file}',
          //   type: Boolean,
          //   description:
          //     'Write ScoredSuite to file',
          // },
          {
            name: 'p',
            alias: 'p',
            typeLabel: '{underline processor}',
            description: `Run the generated cases with the specified ' +
                        'processor (default is -p=${defaultProcessor}).`,
          },
          {
            name: 'r',
            alias: 'r',
            description:
              'When doing a directory scan, recurse through child directories',
            type: Boolean,
          },
          {
            name: 's',
            alias: 's',
            typeLabel: '{underline suiteFilter}',
            description:
              'Boolean expression of suites to run.' +
              'Can use suite names, !, &, |, and parentheses.' +
              'Note that the -n flag overrides the -s flag.',
          },
          {
            name: 't',
            alias: 't',
            typeLabel: '{underline <snowball | metaphone | hybrid >}',
            description: 'Reserved for short-order term model.',
          },
        ],
      },
    ];

    console.log(commandLineUsage(usage));

    if (this.processorFactory.count() > 0) {
      console.log('Available Processors:');
      for (const processor of this.processorFactory.processors()) {
        console.log(`  "-v=${processor.name}": ${processor.description}`);
        // TODO: list expected data files for each processor.
      }
    } else {
      console.log('No Processors available.');
      console.log('The supplied ProcessorFactory has no ProcessorDescriptions');
    }
  }

  exit(code: number) {
    process.exit(code);
  }

  fail(message: string, displayUsage = false) {
    console.log(' ');
    console.log(message);

    if (displayUsage) {
      this.showUsage();
    } else {
      console.log('Use the -h flag for help.');
    }
    console.log(' ');
    console.log('Aborting');
    console.log(' ');
    process.exit(1);
  }
}
