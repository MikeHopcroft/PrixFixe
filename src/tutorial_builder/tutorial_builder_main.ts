import * as commandLineUsage from 'command-line-usage';
import { Section } from 'command-line-usage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as recursiveReaddir from 'recursive-readdir';

import { fail, handleError, succeed } from '../core/test_suite2';
import { createWorld2 } from '../processors';

import { updateMarkdown } from './tutorial_builder';

export async function tutorialBuilderMain() {
  dotenv.config();

  // TODO: get executable and params (e.g. -d, -x) from markdown
  const args = minimist(process.argv.slice(2));

  if (args.h || args.help) {
    showUsage();
    return succeed(false);
  }

  const inFile = args._[0];
  const outFile = args._[1];

  if (!inFile) {
    const message = 'Expected an <input file>.';
    return fail(message);
    // return fail(message, true);
  }

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
    // Create a map from ItemInstance name to SKU.
    const world = createWorld2(dataPath);
    const nameToSKU = new Map<string, number>();
    for (const s of world.catalog.specificEntities()) {
      if (nameToSKU.has(s.name)) {
        console.log(`old SKU = ${nameToSKU.get(s.name)!}`);
        console.log(`new SKU = ${s.sku}`);
        throw new TypeError(`repairSuite: Duplicate name ${s.name}`);
      }
      nameToSKU.set(s.name, s.sku);
      // console.log(`${s.name}: ${s.sku}`);
    }

    await processFileOrFolder(
      inFile,
      outFile,
      args.r === true,
      args.n === true,
      nameToSKU
    );
  } catch (e) {
    handleError(e);
  }

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
        `node ${program} <input file or dir> [output file or dir] [...options]`,
      ],
    },
    {
      header: 'Options',
      optionList: [
        {
          name: 'datapath',
          alias: 'd',
          description: `Path to prix-fixe data files used for menu-based repairs.\n
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
          name: 'dryrun',
          alias: 'n',
          description: 'Dry run: process files and print to console',
          type: Boolean,
        },
        {
          name: 'recursive',
          alias: 'r',
          description: 'Process recursive directory tree',
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

// function fail(message: string, displayUsage = false) {
//     console.log(' ');
//     console.log(message);

//     if (displayUsage) {
//         showUsage();
//     } else {
//         console.log('Use the -h flag for help.');
//     }
//     console.log(' ');
//     console.log('Aborting');
//     console.log(' ');
//     process.exit(1);
// }

// export function succeed(succeeded: boolean) {
//     if (succeeded) {
//         process.exit(0);
//     } else {
//         process.exit(1);
//     }
// }

async function processFileOrFolder(
  inPath: string,
  outPath: string | undefined,
  recursive: boolean,
  dryrun: boolean,
  nameToSKU: Map<string, number>
) {
  // TODO: catch file not found (ENOENT)?
  const inIsDir = fs.lstatSync(inPath).isDirectory();

  if (outPath === undefined) {
    if (inIsDir) {
      outPath = inPath;
    } else {
      outPath = path.dirname(inPath);
    }
  }

  const outIsDir = fs.lstatSync(outPath).isDirectory();

  if (inIsDir && outIsDir) {
    // Process all files from inDir to outDir.
    let files: string[];
    if (recursive) {
      files = await recursiveReaddir(inPath);
    } else {
      files = fs.readdirSync(inPath);
    }

    for (const f of files) {
      const inFile = path.join(inPath, f);
      if (inFile.match(/\.src\.md$/)) {
        await convertFile(nameToSKU, inFile, rename(inFile, outPath), dryrun);
      }
    }
  } else if (outIsDir) {
    // Process one file from inDir to outDir
    if (inPath.match(/\.src\.md$/)) {
      await convertFile(nameToSKU, inPath, rename(inPath, outPath), dryrun);
    } else {
      const message = `File ${inPath} does not end in .src.md`;
      throw new TypeError(message);
    }
  } else if (inIsDir) {
    const message = `Cannot process directory ${inPath} to single output file ${outPath}`;
    throw new TypeError(message);
  } else {
    // Process one file to another
    await convertFile(nameToSKU, inPath, outPath, dryrun);
  }
}

async function convertFile(
  nameToSKU: Map<string, number>,
  inFile: string,
  outFile: string,
  dryrun: boolean
) {
  const inPath = path.resolve(inFile);
  const outPath = path.resolve(outFile);

  if (!inPath.match(/\.src\.md$/)) {
    const message = `File ${inPath} does not end with .src.md`;
    throw new TypeError(message);
  }

  if (outPath.match(/\.src\.md$/)) {
    const message = `File ${outPath} cannot end with .src.md`;
    throw new TypeError(message);
  }

  if (inPath === outPath) {
    const message = `Input file ${inPath} cannot be the same as output file`;
    throw new TypeError(message);
  }

  if (dryrun) {
    console.log('=======================================');
    console.log(`Dry run: ${inFile} => ${outFile}`);
  } else {
    console.log(`Converting: ${inFile} => ${outFile}`);
  }

  const text = fs.readFileSync(inFile, 'utf8');
  const updatedText = await updateMarkdown(nameToSKU, text);

  if (dryrun) {
    console.log(updatedText);
  } else {
    fs.writeFileSync(outFile, updatedText, 'utf8');
  }
}

function rename(fileName: string, outDir: string): string {
  const baseName = path.basename(fileName);
  const outFile = baseName.replace(/(\.src\.md)$/, '.md');
  const outPath = path.join(outDir, outFile);

  return outPath;
}

// tutorial_builder_main();
