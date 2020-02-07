/******************************************************************************
 * 
 * Levenshtein repair distance.
 * 
 * Computing minimum edits to transform sequence A into sequence B.
 * 
 * Given sequences a and b, compute the minimum Levenshtein distance match
 * between b and a prefix of a.
 * 
 * This algorithm is intended to be used to evaluate potential partial matches
 * between catalog items and a longer phrases. Consider the following examples:
 * 
 *   a: "The Pontiac Trans Am parked in the driveway"
 *   b: "The Pontiac" matches at positon 0 with edit distance 0.
 *   b: "Pontiac" matches at postion 1 with edit distance 1.
 *   b: "Pontiac Trans Am" matches at position 1 with edit distance 1.
 *   b: "Pontiac parked in the driveway" matches at position 1 with d=3.
 * 
 * The algorithm can be applied to sequences represented as character string
 * and arrays. In the case of array-based sequences, one can pass an equality
 * predicate. The equality predicate is useful when performing pattern
 * matching against sequences of tokens. As an example:
 * 
 *   a: [PURCHASE] [QUANTITY(5)] [ITEM(27)] [CONJUNCTION] [ITEM(43)]
 *   b: [PURCHASE] [QUANTITY(*)] [ITEM(*)]
 * 
 * matches at position 0 with d=1, when using an equality predicate where
 * [QUANTITY(*)] is equal to any QUANTITY and ITEM(*) is equal to any ITEM.
 * 
 ******************************************************************************/


export interface DiffResults<S, T> {
    cost: number;           // The Levenshtein edit distance for this match.
    edits: Array<Edit<S>>;
}


// Types of edits used in dynamic programming algorithm.
export enum EditOp {
    NONE,       // First position in sequence. No preceding edits.
    INSERT_A,   // Insert one item into sequence A at this point. (move up)
    DELETE_A,   // Delete one item from sequence A at this point. (move right)
    REPAIR_A,     // Repair an item from sequence A to match an item from B. (move diagonal up/right)
}

// TODO: consider renaming levenshtein.ts to repair.ts.
// TODO: consider renaming Edit<STEP> to Repair<STEP>
export interface Edit<STEP> {
    op: EditOp;
    cost: number;
    steps: STEP[];
}

// tslint:disable-next-line:no-any
const nop: Edit<any> = {
    op: EditOp.NONE,
    cost: 0,
    steps: [],
};


// Vertices corresepond to cells in the dynamic programming matrix.
// class Vertex {
//     edit: EditOp;     // The Edit on the best known path into this vertex.
//     cost: number;   // The cost of the best known path through this vertex.

//     constructor(cost: number) {
//         this.edit = EditOp.NONE;
//         this.cost = cost;
//     }

//     // Compares a proposed path with the best known path through this vertex.
//     // Updates vertex with new path if it corresponds to a lower edit distance.
//     update(edit: EditOp, cost: number) {
//         if (this.edit === EditOp.NONE) {
//             // This is the first path considered, so it's the best we've seen
//             // so far, so take it.
//             this.cost = cost;
//             this.edit = edit;
//         }
//         else if (cost < this.cost) {
//             // This path is better than the best seen so far, so take it.
//             this.cost = cost;
//             this.edit = edit;
//         }
//     }
// }
class Vertex<S> {
    edit: Edit<S>;  // The Edit on the best known path into this vertex.
    cost: number;

    constructor(edit: Edit<S>, previousCost: number) {
        this.edit = edit;
        this.cost = previousCost + edit.cost;
    }

    // Compares a proposed path with the best known path through this vertex.
    // Updates vertex with new path if it corresponds to a lower edit distance.
    update(edit: Edit<S>, previousCost: number) {
        this.edit = edit;
        this.cost = previousCost + edit.cost;
        // if (this.edit.op === EditOp.NONE) {
        //     // This is the first path considered, so it's the best we've seen
        //     // so far, so take it.
        //     this.edit = edit;
        //     this.cost = previousCost + edit.cost;
        // }
        // else if (edit.cost < this.edit.cost) {
        //     // This path is better than the best seen so far, so take it.
        //     this.edit = edit;
        //     this.cost = previousCost + edit.cost;
        // }
    }
}

// tslint:disable-next-line:interface-name
export interface IRepairs<S, T> {
    delete(item: T): Edit<S>;
    insert(item: T): Edit<S>;
    repair(existing: T, expected: T): Edit<S>;
}

class DefaultCosts<T> implements IRepairs<string, T> {
    delete(item: T): Edit<string> {
        return {
            op: EditOp.DELETE_A,
            cost: 1,
            steps: ['delete'],
        };
    }

    insert(item: T): Edit<string> {
        return {
            op: EditOp.INSERT_A,
            cost: 1,
            steps: ['insert'],
        };
    }

    repair(existing: T, expected: T): Edit<string> {
        return {
            op: EditOp.REPAIR_A,
            cost: 1,
            steps: ['repair'],
        };
    }
}

class DiffMatrix<S, T> {
    edits: IRepairs<S, T>;

    // The observed sequence.
    a: T[];

    // The expected sequence.
    b: T[];

    // Dynamic programming matrix.
    matrix: Array<Array<Vertex<S>>> = [];

    // Best sequence match and Levenshtein distance will be stored here once
    // the constructor exits.
    result: DiffResults<S, T> = {
        cost: 0,
        edits: [],
    };

    constructor(
        costs: IRepairs<S, T>,
        a: T[],
        b: T[]
    ) {
        this.edits = costs;
        this.a = a;
        this.b = b;

        this.initializeMatrix();
        this.findBestPath();
        this.tracePath();
    }


    // Initialize the dynamic programming matrix with a vertex at each cell.
    // Initialize delete path for sequence `a` (row 0) and sequence `b`
    // (column 0).
    private initializeMatrix(): void {
        const aLen = this.a.length;
        const bLen = this.b.length;

        this.matrix = new Array(bLen + 1).fill([]);
        for (let j = 0; j <= bLen; ++j) {
            const row = new Array(aLen + 1);
            if (j === 0) {
                row[0] = new Vertex(nop, 0);
                for (let i = 1; i <= aLen; ++i) {
                    const edit = this.edits.delete(this.a[i - 1]);
                    row[i] = new Vertex(edit, row[i - 1].cost);
                }
                this.matrix[j] = row;
            }
            else {
                const edit = this.edits.insert(this.b[j - 1]);
                row[0] = new Vertex(edit, this.matrix[j - 1][0].cost);
                for (let i = 1; i <= aLen; ++i) {
                    row[i] = new Vertex(nop, 0);
                }
                this.matrix[j] = row;
            }
        }
    }

    // Dynamic programming algorithm fills in best edits and corresponding
    // Levenshtein distances at each vertex.
    private findBestPath(): void {
        const aLen = this.a.length;
        const bLen = this.b.length;

        for (let j = 1; j <= bLen; ++j) {
            for (let i = 1; i <= aLen; ++i) {
                const a = this.a[i - 1];
                const b = this.b[j - 1];

                // Delete from A
                this.matrix[j][i].update(
                    this.edits.delete(a),
                    this.matrix[j][i - 1].cost
                );
                // this.matrix[j][i].update(
                //     EditOp.DELETE_A,
                //     this.matrix[j][i - 1].cost + this.costs.deleteCost(a)
                // );

                // Insert into A
                this.matrix[j][i].update(
                    this.edits.insert(b),
                    this.matrix[j - 1][i].cost);
                // this.matrix[j][i].update(
                //     EditOp.INSERT_A, this.matrix[j - 1][i].cost + this.costs.insertCost(b));

                // Repair A
                this.matrix[j][i].update(
                    this.edits.repair(a, b),
                    this.matrix[j - 1][i - 1].cost 
                );
                // this.matrix[j][i].update(
                //     EditOp.REPAIR_A,
                //     this.matrix[j - 1][i - 1].cost + this.costs.repairCost(a, b)
                // );
            }
        }
    }

    // Walk backwards over best path, gathering edit sequence.
    private tracePath(): void {
        const edits: Array<Edit<S>> = [];

        let ai = this.a.length;
        let bi = this.b.length;
        let current = this.matrix[bi][ai];
        const cost = current.cost;

        // TODO: build up list of edits here.
        while (current.edit.op !== EditOp.NONE) {
            edits.unshift(current.edit);
            switch (current.edit.op) {
                case EditOp.DELETE_A:
                    ai--;
                    break;
                case EditOp.INSERT_A:
                    bi--;
                    break;
                case EditOp.REPAIR_A:
                    ai--;
                    bi--;
                    break;
                default:
                    // Should never get here.
                    const message = 'Internal error';
                    throw new TypeError(message);
            }

            current = this.matrix[bi][ai];
        }

        this.result = {
            edits,
            cost,
        };
    }
}

// Generic sequence diff.
export function levenshtein<S, T>(
    costs: IRepairs<S, T>,
    observed: T[],
    expected: T[]
): DiffResults<S, T> {
    const d = new DiffMatrix<S, T>(costs, observed, expected);
    return d.result;
}
