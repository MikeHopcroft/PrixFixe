import * as style from 'ansi-styles';
import * as replServer from 'repl';

import { ICatalog, Key, MENUITEM, PID, OPTION } from '../catalog';

import { aliasesFromPattern, patternFromExpression } from '../utilities';

import {
    IRepl,
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

    registerCommands(repl: IRepl): void {
        const catalog = this.world.catalog;
        const world = this.world;

        repl.getReplServer().defineCommand('menu', {
            help: 'Display menu',
            action: (line: string) => {
                displayMenu(world, line);
                repl.getReplServer().displayPrompt();
            },
        });

        repl.getReplServer().defineCommand('products', {
            help: 'Display top-level products',
            action: (line: string) => {
                displayMenu(world, line, MENUITEM);
                repl.getReplServer().displayPrompt();
            },
        });

        repl.getReplServer().defineCommand('options', {
            help: 'Display options',
            action: (line: string) => {
                displayMenu(world, line, OPTION);
                repl.getReplServer().displayPrompt();
            },
        });

        repl.getReplServer().defineCommand('aliases', {
            help: 'Display aliases for a generic',
            action: (line: string) => {
                const pid = Number(line);
                if (!isNaN(pid) && catalog.hasPID(pid)) {
                    // This is a generic entity. Print out its aliases.
                    const item = catalog.getGeneric(pid);
                    console.log(`${item.name} (${item.pid})`);
                    printAliases(world, pid);
                } else {
                    console.log(`Unknown PID "${line}".`);
                    console.log('Usage: .aliases <PID>');
                }
                repl.getReplServer().displayPrompt();
            },
        });

        repl.getReplServer().defineCommand('specifics', {
            help: 'Display list of legal specifics for a generic',
            action: (line: string) => {
                const pid = Number(line);
                if (!isNaN(pid) && catalog.hasPID(pid)) {
                    // This is a generic entity. Print out its specifics.
                    printLegalSpecifics(world, pid);
                } else {
                    console.log(`Unknown PID "${line}".`);
                    console.log('Usage: .specifics <PID>');
                }
                repl.getReplServer().displayPrompt();
            },
        });

        repl.getReplServer().defineCommand('exclusions', {
            help: 'Display exclusion sets for a generic',
            action: (line: string) => {
                const pid = Number(line);
                if (!isNaN(pid) && catalog.hasPID(pid)) {
                    // This is a generic entity. Print out its specifics.
                    printExlusionSets(world, pid);
                } else {
                    console.log(`Unknown PID "${line}".`);
                    console.log('Usage: .exclusions <PID>');
                }
                repl.getReplServer().displayPrompt();
            },
        });
    }

    createProcessor(): ReplProcessor | null {
        return null;
    }
}

function displayMenu(world: World, line: string, kind?: MENUITEM | OPTION) {
    if (line.length === 0) {
        // No Key or PID was specified. Print out name of all of the
        // MENUITEM generics.
        printCatalog(world.catalog, kind);
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
        console.log(' ');
    }
}

export const prixFixeReplExtensionFactory: IReplExtensionFactory = {
    create: (world: World, dataPath: string) => {
        return new PrixFixeReplExtension(world, dataPath);
    },
};

export function printCatalog(
    catalog: ICatalog,
    kind: MENUITEM | OPTION | undefined
) {
    for (const item of catalog.genericEntities()) {
        if (!kind || item.kind === kind) {
            console.log(`${item.name} (${item.pid})`);
        }
    }
    console.log(' ');
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

        printLegalSpecifics(world, pid);

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

        printExlusionSets(world, pid);
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

function printLegalSpecifics(world: World, pid: PID) {
    const catalog = world.catalog;
    const item = catalog.getGeneric(pid);
    console.log('  Specifics:');
    for (const key of catalog.getSpecificsForGeneric(pid)) {
        const defaultMark = item.defaultKey === key ? ' <== default' : '';
        const s = catalog.getSpecific(key);
        const name = s.name;
        const sku = s.sku;
        console.log(`    ${name} (${key}, ${sku})${defaultMark}`);
    }
}

function printExlusionSets(world: World, pid: PID) {
    const catalog = world.catalog;
    const rules = world.ruleChecker;
    for (const [i, group] of rules.getExclusionGroups(pid).entries()) {
        console.log(`  Exclusion Set ${i}`);
        for (const p of group.values()) {
            const item = catalog.getGeneric(p);
            console.log(`    ${item.name} (${item.pid})`);
        }
    }
}
