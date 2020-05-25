import { leftJustify, rightJustify } from '..';

import {
    GenericCase,
    GenericSuite,
    LogicalCart,
    TextTurn,
    ValidationStep,
    LogicalItem,
} from './interfaces';

export function markdown<
    SUITE1 extends GenericSuite<STEP1>,
    STEP1 extends ValidationStep<TextTurn>
>(suite: SUITE1): string {
    const fragments: string[] = [];
    markdownTraverse(fragments, suite);
    return fragments.join('\n');
}

// Extract this function into a generator
function markdownTraverse<
    SUITE1 extends GenericSuite<STEP1>,
    STEP1 extends ValidationStep<TextTurn>
>(fragments: string[], suite: SUITE1) {
    for (const test of suite.tests) {
        if ('id' in test) {
            renderTest(fragments, test);
        } else {
            if (test.comment) {
                fragments.push(test.comment);
            }
            markdownTraverse(fragments, test);
        }
    }
}

// Rename this file to render.ts or format.ts or something else
// Make this render test as text (instead of markdown). Wrap inside of markdown renderer.
function renderTest<STEP1 extends ValidationStep<TextTurn>>(
    fragments: string[],
    test: GenericCase<STEP1>
) {
    fragments.push(test.comment);
    fragments.push('~~~');
    for (const [i, step] of test.steps.entries()) {
        renderStep(fragments, step);
        if (i < test.steps.length - 1) {
            fragments.push('');
        }
    }
    fragments.push('~~~');
}

function renderStep<STEP1 extends ValidationStep<TextTurn>>(
    fragments: string[],
    step: STEP1
) {
    for (const turn of step.turns) {
        fragments.push(`${turn.speaker}: ${turn.transcription}`);
    }
    fragments.push('');
    renderCart(fragments, step.cart);
}

export function renderCart(fragments: string[], cart: LogicalCart) {
    if (cart.items.length > 0) {
        for (const item of cart.items) {
            renderItem(fragments, 0, item);
        }
    } else {
        fragments.push('(empty cart)');
    }
}

function renderItem(fragments: string[], level: number, item: LogicalItem) {
    const leftFieldWidth = 4 + level * 2;
    const left = rightJustify(item.quantity + ' ', leftFieldWidth);

    const rightFieldWidth = 10;
    let right = '';
    right = rightJustify(item.sku, rightFieldWidth);

    const totalWidth = 50;
    const middleWidth = Math.max(0, totalWidth - left.length - right.length);
    const middle = leftJustify(`${item.name} (${item.sku})`, middleWidth);

    const line = `${left}${middle}${right}`;
    fragments.push(line);

    for (const child of item.children) {
        renderItem(fragments, level + 1, child);
    }
}
