import commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import dotenv from 'dotenv';
import fs from 'fs';
import minimist from 'minimist';
import path from 'path';
import recursiveReaddir from 'recursive-readdir';

import { Processor, State } from '../core/processors';

import {
  enumerateTestCases,
  filterSuite,
  formatScoredSuite,
  FormatScoredSuiteOptions,
  handleError,
  mapSuiteAsync,
  suitePredicateFilter,
} from '../core/test_suite';

import { World } from '../core/world';

import { createWorld } from '../processors';
import { suitePredicate } from './suite_predicate';
import { TestProcessors } from './test_processors';

import {
  AnyTurn,
  GenericCase,
  GenericSuite,
  LogicalValidationSuite,
  ScoredStep,
  TextTurn,
  ValidationStep,
  LogicalScoredSuite,
} from '../core/test_suite/interfaces';

import {
  loadLogicalScoredSuite,
  loadLogicalValidationSuite,
  writeYAML,
} from './loaders';

import { logicalCartFromCart } from '../core/test_suite/logical_cart';
import { createMenuBasedRepairFunction } from '../core/test_suite/repair_functions';
import { scoreSuite } from '../core/test_suite/scoring';

export interface ILogger {
  log(text: string): void;
}

export class ConsoleLogger implements ILogger {
  log(text: string) {
    console.log(text);
  }
}

export class NopLogger implements ILogger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(text: string) {
    // Do nothing
  }
}

export async function testRunnerMain(
  title: string,
  processorFactory: TestProcessors,
  argv: string[] | undefined = undefined,
  logger: ILogger | undefined = undefined
) {
  const app = new TestRunnerApplication(
    title,
    processorFactory,
    logger || new ConsoleLogger()
  );
  await app.go(argv || process.argv);
}

interface ApplicatonConfiguration {
  baselineFile: string | undefined;
  dataPath: string;
  dryRunMode: boolean;
  inputFile: string;
  outputFile: string | undefined;
  processorName: string | undefined;
  recursive: boolean;
  showDetails: boolean;
  showMeasures: boolean;
  showPassing: boolean;
  speaker: string | undefined;
  suiteExpressionText: string | undefined;
  testId: number | undefined;
}

export class TestRunnerApplication {
  private readonly title: string;
  private readonly processorFactory: TestProcessors;
  private readonly logger: ILogger;

  constructor(
    title: string,
    processorFactory: TestProcessors,
    logger: ILogger
  ) {
    this.title = title;
    this.processorFactory = processorFactory;
    this.logger = logger;
  }

  async go(argv: string[]): Promise<number> {
    try {
      this.logger.log(`${this.title} test runner`);
      this.logger.log(new Date().toLocaleString());

      const config = this.processArguments(argv);
      const { dryRunMode } = config;

      const suite = await this.loadSuite(config);

      if (dryRunMode) {
        // In brief mode, don't actually run the tests.
        // Just display the input text.
        this.displayBriefView(suite);
        this.logger.log('Tests not run.');
        this.logger.log('Exiting with failing return code.');
        shutdown(1);
      } else {
        // Run the tests in the suite.
        const scored = await this.runTests(config, suite);

        // Display results.
        this.displayResults(config, scored);

        // Write results to outputFile, if specified.
        this.writeResults(config, scored);

        const returnCode = this.finish(config, scored);

        return returnCode;
      }
    } catch (e) {
      if (e instanceof ShutdownError) {
        return e.code;
      } else {
        handleError(e);
      }
    }
  }

  private processArguments(argv: string[]): ApplicatonConfiguration {
    dotenv.config();

    //
    // Validate command-line arguments.
    //

    const args = minimist(argv.slice(2));

    // NOTE: must check for help before other flags as an error related to a
    // flag value might cause an early fail that would prevent showing the
    // help message.
    if (args.h || args.help || args['?']) {
      this.showUsage();
      shutdown(0);
    }

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
      dataPath = args.d;
    }
    if (dataPath === undefined) {
      const message =
        'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path';
      this.fail(message);
    }
    this.logger.log(`data path = ${dataPath}`);

    const baselineFile = args.baseline as string | undefined;
    const showDetails = args.details === 'false' ? false : true;
    const showMeasures = args.n === undefined;
    const showPassing = args.a === true || args.n !== undefined;
    const dryRunMode = args.dryrun === true;
    // const markdown = args['m'] === true;

    let testId: number | undefined;
    if (args.n) {
      testId = Number(args.n);
      if (Number.isNaN(testId)) {
        const message = 'Expected test number after -n flag.';
        this.fail(message);
      }
    }

    const processorName = args.p as string | undefined;
    const recursive = args.r === true;
    const suiteExpressionText = args.s as string | undefined;
    const speaker = args.speaker as string | undefined;

    const inputFile = args._[0] as string | undefined;
    const outputFile = args._[1] as string | undefined;

    if (inputFile === undefined) {
      const message = 'Expected YAML input file or directory on command line.';
      this.fail(message, true);
    }

    return {
      baselineFile,
      dataPath,
      dryRunMode,
      inputFile,
      outputFile,
      processorName,
      recursive,
      showDetails,
      showMeasures,
      showPassing,
      speaker,
      suiteExpressionText,
      testId,
    };
  }

  private async loadSuite(
    config: ApplicatonConfiguration
  ): Promise<GenericSuite<ValidationStep<TextTurn>>> {
    const { inputFile, recursive, suiteExpressionText, testId } = config;

    // Generate list of input files. The `input` parameter is either the name
    // of a single test suite file or a directory containing a set of test
    // suite files. Load these files and combine into a single test suite.
    const testFiles = await this.findTestSuites(inputFile, recursive);
    let suite = this.loadAndCombineTestSuites(inputFile, testFiles);

    // Filter suite by test case id or suite expression, if specified.
    suite = this.filterTestSuites(suite, testId, suiteExpressionText);

    return suite;
  }

  private displayBriefView(suite: GenericSuite<ValidationStep<TextTurn>>) {
    this.logger.log(' ');
    this.logger.log('Displaying test utterances without running.');
    for (const test of enumerateTestCases(suite)) {
      this.logger.log(`Test ${test.id}: ${test.comment}`);
      for (const [i, step] of test.steps.entries()) {
        this.logger.log(`  Step ${i}`);
        for (const turn of step.turns) {
          this.logger.log(`    ${turn.speaker}: ${turn.transcription}`);
        }
      }
      this.logger.log(' ');
    }
  }

  private displayResults(
    config: ApplicatonConfiguration,
    scored: LogicalScoredSuite<AnyTurn>
  ) {
    const { showDetails, showMeasures, showPassing } = config;

    // Display results.
    const lines: string[] = [];
    const options: FormatScoredSuiteOptions = {
      showDetails,
      showPassing,
      showFailing: true,
      showBySuite: true,
      showMeasures,
    };

    formatScoredSuite(lines, scored, options);
    for (const line of lines) {
      this.logger.log(line);
    }
  }

  private writeResults(
    config: ApplicatonConfiguration,
    scored: LogicalScoredSuite<AnyTurn>
  ) {
    const { outputFile } = config;

    if (outputFile) {
      this.logger.log(`Writing to "${outputFile}"`);
      writeYAML(outputFile, scored);
    }
  }

  private finish(
    config: ApplicatonConfiguration,
    scored: LogicalScoredSuite<AnyTurn>
  ): number {
    const { baselineFile } = config;

    if (baselineFile) {
      this.logger.log(`Baseline: "${baselineFile}"`);
      this.logger.log(' ');
      const baseline = loadLogicalScoredSuite(baselineFile);
      const { regressions } = this.compareScoredSuites(baseline, scored);

      if (regressions > 0) {
        // Exit with non-zero return code, if we're comparing with a baseline
        // and found regressions. Previous behavior was to fail if the number
        // of passing tests has decreased.
        return 1;
      }
    } else if (scored.measures.totalRepairs > 0) {
      // Exit with non-zero return code, if we're not comparing with a baseline and
      // there is at least one repair.
      return 1;
    }

    // Successful exit.
    return 0;
  }

  private showUsage() {
    const defaultProcessor = this.processorFactory.getDefault().name;
    const program = path.basename(process.argv[1]);

    const usage: Section[] = [
      {
        header: 'Test Runner',
        content:
          'This utility allows the user to run text utterances to verify intermediate and final cart states using a YAML test case file.',
      },
      {
        header: 'Usage',
        content: [
          `node ${program} <file|directory> [output file] [...options]`,
          '',
          'Where <file> is the name of a single YAML test suite file and <directory> is a directory of YAML test suite files.',
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
            name: 'speaker',
            typeLabel: '{underline speaker}',
            description: 'If specified, only include turns from this speaker',
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

    this.logger.log(commandLineUsage(usage));

    if (this.processorFactory.count() > 0) {
      this.logger.log('Available Processors:');
      for (const processor of this.processorFactory.processors()) {
        this.logger.log(`  "-v=${processor.name}": ${processor.description}`);
        // TODO: list expected data files for each processor.
      }
    } else {
      this.logger.log('No Processors available.');
      this.logger.log(
        'The supplied ProcessorFactory has no ProcessorDescriptions'
      );
    }
  }

  private fail(message: string, displayUsage = false): never {
    this.logger.log(' ');
    this.logger.log(message);

    if (displayUsage) {
      this.showUsage();
    } else {
      this.logger.log('Use the -h flag for help.');
    }
    this.logger.log(' ');
    this.logger.log('Aborting');
    this.logger.log(' ');

    shutdown(1);
  }

  private async findTestSuites(
    input: string,
    recursive: boolean
  ): Promise<string[]> {
    let testFiles: string[];
    if (fs.lstatSync(input).isDirectory()) {
      this.logger.log(`Searching for test suites in ${input}`);

      let files;
      if (recursive) {
        files = await recursiveReaddir(input);
      } else {
        files = fs.readdirSync(input);
      }

      testFiles = files
        .sort()
        .filter((f) => f.endsWith('yaml') || f.endsWith('yml'))
        .map((f) => path.resolve(input, f));
    } else {
      // Assume that input is a YAML test file.
      testFiles = [input];
    }

    this.logger.log('Test files:');
    for (const file of testFiles) {
      this.logger.log(`  ${file}`);
    }

    return testFiles;
  }

  private loadAndCombineTestSuites(input: string, testFiles: string[]) {
    let suite: GenericSuite<ValidationStep<TextTurn>>;
    try {
      if (testFiles.length === 1) {
        const testFile = testFiles[0];
        this.logger.log(`Reading ${testFile}`);
        suite = loadLogicalValidationSuite(testFile);
      } else {
        // Suite is the combination of a number of suites..
        suite = {
          comment: `Combination of ${input}/*.yaml`,
          tests: [],
        };
        for (const testFile of testFiles) {
          this.logger.log(`Reading ${testFile}`);
          const s: LogicalValidationSuite<TextTurn> =
            loadLogicalValidationSuite(testFile);
          suite.tests.push({
            comment: testFile,
            tests: [s],
          });
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        const message = `Cannot open test file "${err.path}"`;
        this.fail(message);
      }
      throw err;
    }

    return suite;
  }

  private filterTestSuites(
    suite: GenericSuite<ValidationStep<TextTurn>>,
    testId: number | undefined,
    suiteExpressionText: string | undefined
  ): GenericSuite<ValidationStep<TextTurn>> {
    if (testId !== undefined) {
      this.logger.log(`Running test with id=${testId}.`);
      suite = filterSuite(suite, (test) => testId === test.id);
    } else if (suiteExpressionText) {
      this.logger.log(
        `Running tests matching suite expression: ${suiteExpressionText}`
      );
      const suiteExpression = suitePredicate(suiteExpressionText);
      suite = filterSuite(suite, suitePredicateFilter(suiteExpression));
    } else {
      this.logger.log('Running all tests.');
    }
    return suite;
  }

  private async runTests(
    config: ApplicatonConfiguration,
    suite: GenericSuite<ValidationStep<TextTurn>>
  ): Promise<LogicalScoredSuite<AnyTurn>> {
    const { dataPath, processorName, speaker } = config;

    if (speaker !== undefined) {
      this.logger.log(`Only including turns where speaker is "${speaker}"`);
    }

    //
    // Load the menu.
    //
    let world: World;
    try {
      world = createWorld(dataPath);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        const message = `Create world failed: cannot open "${err.path}"`;
        this.fail(message);
      }
      throw err;
    }

    //
    // Set up short-order processor.
    //
    if (this.processorFactory.count() === 0) {
      const message =
        'ProcessorFactory must contain at least one ProcessorDescription.';
      this.fail(message);
    }

    let processor: Processor;
    if (processorName) {
      if (!this.processorFactory.has(processorName)) {
        const message = `Unknown processor v=${processorName}`;
        this.fail(message);
      }
      processor = this.processorFactory.create(processorName, world, dataPath);
      this.logger.log(`processor = ${processorName}`);
    } else {
      const description = this.processorFactory.getDefault();
      processor = description.create(world, dataPath);
      this.logger.log(`processor = ${description.name}`);
    }

    this.logger.log(' ');

    //
    // Run each test case.
    //
    const observed = await mapSuiteAsync(suite, async (test) => {
      let state: State = { cart: { items: [] } };
      const steps: typeof test.steps = [];
      for (const step of test.steps) {
        for (const turn of step.turns) {
          if (speaker === undefined || turn.speaker === speaker) {
            try {
              state = await processor(turn.transcription, state);
            } catch (e) {
              // TODO: record the error here, somehow.
            }
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

  private compareScoredSuites(
    baseline: LogicalScoredSuite<AnyTurn>,
    current: LogicalScoredSuite<AnyTurn>
  ): { delta: number; regressions: number } {
    let bp = 0; // Baseline passing case count
    let cp = 0; // Current passing case count
    let regressions = 0; // Regressed case count
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
          this.logger.log(`${b.id}: ${bText} => ${cText}`);
          if (br === 0) {
            regressions++;
          }
        }
      } else {
        ++missingTests;
        this.logger.log(`${b.id}: REMOVED(${bText})`);
      }
    }

    for (const c of cIdToTest.values()) {
      const b = bIdToTest.get(c.id);
      if (!b) {
        ++newTests;
        const cr = c.steps.reduce((p, c) => p + c.measures.repairs!.cost, 0);
        const cText = cr === 0 ? 'OK' : `FAILED(${cr})`;
        this.logger.log(`${c.id}: NEW(${cText})`);
      }
    }

    const delta = cp - bp;

    this.logger.log(' ');
    this.logger.log(`Baseline passing tests: ${bp}`);
    this.logger.log(`Current passing tests: ${cp}`);
    this.logger.log(`Delta: ${delta}`);
    this.logger.log(`Regressions: ${regressions}`);

    this.logger.log(' ');
    this.logger.log(`Missing tests: ${missingTests}`);
    this.logger.log(`New tests: ${newTests}`);

    return { delta, regressions };
  }
}

class ShutdownError extends Error {
  code: number;

  constructor(code: number) {
    super('Shutdown');
    this.code = code;
  }
}

function shutdown(code: number): never {
  throw new ShutdownError(code);
}
