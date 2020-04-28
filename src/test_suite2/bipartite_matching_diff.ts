import { DiffResults, Edit, IRepairs } from './tree_diff';

const munkres: (
    a: number[][]
) => Array<[number, number]> = require('munkres-js');

export function bipartiteMatchingDiff<S, T>(
    repairs: IRepairs<S, T>,
    a: T[],
    b: T[]
): DiffResults<S> {
    // Construct 2D array of possible edits.
    const ops: Array<Array<Edit<S>>> = [];
    const al = a.length;
    const bl = b.length;
    const n = Math.max(al, bl);

    if (n === 0) {
        return { cost: 0, edits: [] };
    }

    for (let ai = 0; ai < n; ++ai) {
        const row: Array<Edit<S>> = [];
        for (let bi = 0; bi < n; ++bi) {
            if (ai < al) {
                if (bi < bl) {
                    row.push(repairs.repair(a[ai], b[bi]));
                } else {
                    row.push(repairs.delete(a[ai]));
                }
            } else {
                row.push(repairs.insert(b[bi]));
            }
        }
        ops.push(row);
    }

    // Project to 2D array of costs
    const costs: number[][] = ops.map(row => {
        return row.map(edit => edit.cost);
    });

    // Perform Munkres assignment
    const assignments = munkres(costs);

    // Map assignments back to list of operations.
    const edits = assignments
        .map(a => ops[a[0]][a[1]])
        .filter(e => e.cost !== 0);

    // Total up the costs.
    let cost = 0;
    for (const e of edits) {
        cost += e.cost;
    }

    // Return DiffResults.
    return { cost, edits };
}
