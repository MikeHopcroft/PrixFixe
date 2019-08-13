import * as style from 'ansi-styles';
import * as replServer from 'repl';

import { ICatalog, Key, MENUITEM, PID } from '../catalog';

import { aliasesFromPattern, patternFromExpression } from '../utilities';

import {
    IReplExtension,
    IReplExtensionFactory,
    ReplProcessor,
} from './interfaces';

import { World } from '../processors';

export class PrixFixeReplExtension implements IReplExtension {
    world: World;

    constructor(world: World, dataPath: string) {
        this.world = world;
    }

    name() {
        return 'prix-fixe';
    }

    registerCommands(repl: replServer.REPLServer): void {
        const catalog = this.world.catalog;
        const world = this.world;

        repl.defineCommand('menu', {
            help: 'Display menu',
            action: (line: string) => {
                if (line.length === 0) {
                    // No Key or PID was specified. Print out name of all of the
                    // MENUITEM generics.
                    printCatalog(catalog);
                } else if (line.indexOf(':') !== -1) {
                    // This is a specific entity. Just print out its options.
                    const key = line.trim();
                    describeSpecific(world, key);
                } else if (!isNaN(Number(line))) {
                    // This is a generic entity. Print out its attributes and options.
                    const pid: PID = Number(line);
                    describeGeneric(world, pid);
                } else {
                    console.log(`Unknown item "${line}".`);
                }
                repl.displayPrompt();
            },
        });

        repl.defineCommand('aliases', {
            help: 'Display aliases for a generic',
            action: (line: string) => {
                const pid = Number(line);
                if (!isNaN(pid) && catalog.hasPID(pid)) {
                    // This is a generic entity. Print out its aliases.
                    const item = catalog.getGeneric(pid);
                    console.log(`${item.name} (${item.pid})`);
                    printAliases(world, pid);
                } else {
                    console.log(`Unknown item "${line}".`);
                }
                repl.displayPrompt();
            },
        });
    }

    createProcessor(): ReplProcessor | null {
        return null;
    }
}

export const prixFixeReplExtensionFactory: IReplExtensionFactory = {
    create: (world: World, dataPath: string) => {
        return new PrixFixeReplExtension(world, dataPath);
    },
};

export function printCatalog(catalog: ICatalog) {
    for (const item of catalog.genericEntities()) {
        if (item.kind === MENUITEM) {
            console.log(`${item.name} (${item.pid})`);
        }
    }
}

export function describeSpecific(world: World, key: Key) {
    const catalog = world.catalog;

    if (!catalog.hasKey(key)) {
        console.log(`${style.red.open}Unknown Key ${key}${style.red.close}`);
    } else {
        const specific = catalog.getSpecific(key);
        console.log(`${specific.name} (${specific.key})`);

        console.log(`  Options for ${specific.name}:`);
        const lines: string[] = [];
        for (const childPID of world.ruleChecker.getValidChildren(key)) {
            if (catalog.hasPID(childPID)) {
                const child = catalog.getGeneric(childPID);
                lines.push(`${child.name} (${child.pid})`);
            }
        }
        lines.sort();
        for (const line of lines) {
            console.log(`    ${line}`);
        }
    }
}

export function describeGeneric(world: World, pid: PID) {
    const catalog = world.catalog;

    if (!catalog.hasPID(pid)) {
        console.log(`${style.red.open}Unknown PID ${pid}${style.red.close}`);
    } else {
        const item = catalog.getGeneric(pid);
        console.log(`${item.name} (${item.pid})`);

        printAliases(world, pid);

        console.log('  Attributes:');
        const tensor = world.attributeInfo.getTensor(item.tensor);
        for (const dimension of tensor.dimensions) {
            console.log(`    ${dimension.name}`);
            for (const [index, attribute] of dimension.attributes.entries()) {
                // const aliases = attribute.aliases.map(x => `"${x}"`).join(', ');
                // console.log(`      ${attribute.name} (${attribute.aid}) - ${aliases}`);
                console.log(`      ${attribute.name} (${index})`);
                const aliases: string[] = [];
                for (const alias of attribute.aliases) {
                    const pattern = patternFromExpression(alias);
                    for (const text of aliasesFromPattern(pattern)) {
                        aliases.push(text);
                    }
                }
                aliases.sort();
                for (const alias of aliases) {
                    console.log(`        ${alias}`);
                }
            }
        }

        console.log('  Specifics:');
        for (const key of catalog.getSpecificsForGeneric(pid)) {
            const defaultMark = item.defaultKey === key ? ' <== default' : '';
            const name = catalog.getSpecific(key).name;
            console.log(`    ${name} (${key})${defaultMark}`);
        }

        const specific = catalog.getSpecific(item.defaultKey);

        console.log(`  Options for ${specific.name}:`);
        const lines: string[] = [];
        for (const childPID of world.ruleChecker.getValidChildren(
            item.defaultKey
        )) {
            if (catalog.hasPID(childPID)) {
                const child = catalog.getGeneric(childPID);
                lines.push(`${child.name} (${child.pid})`);
            }
        }
        lines.sort();
        for (const line of lines) {
            console.log(`    ${line}`);
        }
    }
}

function printAliases(world: World, pid: PID) {
    const catalog = world.catalog;

    if (!catalog.hasPID(pid)) {
        console.log(`${style.red.open}Unknown PID ${pid}${style.red.close}`);
    } else {
        const item = catalog.getGeneric(pid);
        console.log('  Aliases:');
        const aliases: string[] = [];
        for (const alias of item.aliases) {
            const pattern = patternFromExpression(alias);
            for (const text of aliasesFromPattern(pattern)) {
                aliases.push(text);
            }
        }
        aliases.sort();
        for (const alias of aliases) {
            console.log(`    ${alias}`);
        }
    }
}
