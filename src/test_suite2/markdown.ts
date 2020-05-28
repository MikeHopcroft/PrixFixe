import { leftJustify, rightJustify } from '..';

import {
    GenericCase,
    GenericSuite,
    LogicalCart,
    LogicalItem,
    ScoredStep,
    TextTurn,
    ValidationStep,
} from './interfaces';

type MaybeScoredStep = ValidationStep<TextTurn> | ScoredStep<TextTurn>;
type MaybeScoredSuite = GenericSuite<MaybeScoredStep>;

export function renderSuiteAsMarkdown(suite: MaybeScoredSuite): string {
    const fragments: string[] = [];
    renderSuiteAsMarkdownTraverse(fragments, suite);
    return fragments.join('\n');
}

function renderSuiteAsMarkdownTraverse(
    fragments: string[],
    suite: MaybeScoredSuite
) {
    for (const test of suite.tests) {
        if ('id' in test) {
            renderTestAsMarkdown(fragments, test);
        } else {
            if (test.comment) {
                fragments.push(test.comment);
            }
            renderSuiteAsMarkdownTraverse(fragments, test);
        }
    }
}

function renderTestAsMarkdown(
    fragments: string[],
    test: GenericCase<MaybeScoredStep>
) {
    fragments.push(test.comment);
    fragments.push('~~~');

    if ('measures' in test.steps[0]) {
        const repairCost = test.steps.reduce(
            (p, c) => {
                if ('measures' in c) {
                    return p + c.measures.repairs!.cost;
                } else {
                    return p;
                }
            },
            0
        );
        const status = repairCost === 0 ? 'PASSED' : 'FAILED';
        fragments.push(`Status: ${status}`);
    }
    
    renderTestAsText(fragments, test);
    fragments.push('~~~');
}

// Rename this file to render.ts or format.ts or something else
export function renderTestAsText(
    fragments: string[],
    test: GenericCase<MaybeScoredStep>
) {
    for (const [i, step] of test.steps.entries()) {
        renderStepAsText(fragments, step);
        if (i < test.steps.length - 1) {
            fragments.push('');
        }
    }
}

function renderStepAsText(fragments: string[], step: MaybeScoredStep) {
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
