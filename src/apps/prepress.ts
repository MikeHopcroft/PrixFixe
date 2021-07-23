import {
  AnySection,
  Entry,
  IFS,
  makeBlock,
  Processor,
  tutorialBuilderMain,
} from 'prepress';

import { handleError, succeed } from '../core/test_suite';
import { createWorld } from '../processors';

async function go() {
  try {
    // Create a map from ItemInstance name to SKU.
    const dataPath = 'samples/menu';
    const world = createWorld(dataPath);
    const nameToSKU = new Map<string, number>();
    for (const s of world.catalog.specificEntities()) {
      if (nameToSKU.has(s.name)) {
        console.log(`old SKU = ${nameToSKU.get(s.name)!}`);
        console.log(`new SKU = ${s.sku}`);
        throw new TypeError(`repairSuite: Duplicate name ${s.name}`);
      }
      nameToSKU.set(s.name, s.sku);
    }

    nameToSKU.set('Product A', 601);
    nameToSKU.set('Product B', 605);
    nameToSKU.set('Product C', 801);

    nameToSKU.set('Option X', 5200);
    nameToSKU.set('Option Y', 2502);

    const processor = (fs: IFS, blocks: AnySection[], group: Entry[]) => {
      const re = /(\d+)\s+([^(]+)\s+\((\d+(?:\.\d+)?)\)/g;

      function replacer(
        match: string,
        quantity: string,
        name: string,
        sku: string
      ) {
        const newSKU = nameToSKU.get(name);
        if (!newSKU) {
          const message = `Unknown product "${name}"`;
          throw new TypeError(message);
        }
        if (sku !== newSKU.toString()) {
          console.log(`${name}: ${sku} => ${newSKU}`);
        }
        return `${quantity} ${name} (${newSKU})`;
      }

      for (const entry of group) {
        const block = entry.block;
        const body = block.body.map((line) => {
          return line.replace(re, replacer);
        });

        blocks[entry.index] = makeBlock(block, body);
      }
    };

    const extensions = new Map<string, Processor>([['repair', processor]]);

    await tutorialBuilderMain(process.argv, extensions);
  } catch (e) {
    handleError(e);
  }

  succeed(true);
}

go();
