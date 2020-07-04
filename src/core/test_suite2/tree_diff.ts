// TODO: update comment
// TODO: rename to treeDiff?

/******************************************************************************
 *
 * Tree repair distance.
 *
 * Computes the shortest sequence of edits to transform tree A into tree B.
 *
 * This algorithm is intended to be used to score shopping carts, by reporting
 * the number of edits to convert an observed cart to an expected cart.
 *
 * Edit cost assumptions
 *   1. any subtree can be deleted in its entirety is a single edit.
 *   2. adding a single instance of specific item that is its generic's default
 *      form is a single edit. This applies to top-level products, and their
 *      children.
 *   3. changing an attribute value is a single edit.
 *   4. changing a quantity is a single edit.
 *
 ******************************************************************************/

export interface DiffResults<S> {
  cost: number; // The Levenshtein edit distance for this match.
  edits: Array<Edit<S>>;
}

// Types of edits used in dynamic programming algorithm.
export enum EditOp {
  NONE, // First position in sequence. No preceding edits.
  DELETE_A, // Delete one item from sequence A at this point. (move right)
  INSERT_A, // Insert one item into sequence A at this point. (move up)
  REPAIR_A, // Repair an item from sequence A to match an item from B. (move diagonal up/right)
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

// tslint:disable-next-line:interface-name
export interface IRepairs<S, T> {
  // Returns an Edit<S> that gives the cost and sequence of steps required
  // to delete a specified item.
  delete(item: T): Edit<S>;

  // Returns an Edit<S> that gives the cost and sequence of steps required
  // to insert a specified item.
  insert(item: T): Edit<S>;

  // Returns an Edit<S> that gives the cost and sequence of steps required
  // to convert the observed item to the expected item.
  repair(observed: T, expected: T): Edit<S>;
}

export type TreeDiffFunction<S, T> = (
  costs: IRepairs<S, T>,
  observed: T[],
  expected: T[]
) => DiffResults<S>;

// Vertices corresepond to cells in the dynamic programming matrix.
class Vertex<S> {
  edit: Edit<S>; // The Edit on the best known path into this vertex.
  cost: number;

  constructor(edit: Edit<S>, previousCost: number) {
    this.edit = edit;
    this.cost = previousCost + edit.cost;
  }

  // Compares a proposed path with the best known path through this vertex.
  // Updates vertex with new path if it corresponds to a lower edit distance.
  update(edit: Edit<S>, previousCost: number) {
    const newCost = previousCost + edit.cost;
    if (newCost < this.cost) {
      this.edit = edit;
      this.cost = newCost;
    }
  }
}

class TreeDiff<S, T> {
  edits: IRepairs<S, T>;

  // The observed sequence.
  a: T[];

  // The expected sequence.
  b: T[];

  // Dynamic programming matrix.
  matrix: Array<Array<Vertex<S>>> = [];

  // Best sequence match and Levenshtein distance will be stored here once
  // the constructor exits.
  result: DiffResults<S> = {
    cost: 0,
    edits: [],
  };

  constructor(costs: IRepairs<S, T>, a: T[], b: T[]) {
    this.edits = costs;
    this.a = a;
    this.b = b;

    this.initializeFirstRowAndColumn();
    this.forwardPropagate();
    this.tracePath();
  }

  // Initialize the first row and column of the dynamic programming matrix.
  // Cells in the first row and column differ from the other cells, in that
  // they are only reachable from one neighbor (previous), instead of three
  // (left, below, below-left).
  private initializeFirstRowAndColumn(): void {
    const aLen = this.a.length;
    const bLen = this.b.length;

    this.matrix = new Array(bLen + 1).fill([]);
    for (let j = 0; j <= bLen; ++j) {
      const row = new Array(aLen + 1);
      if (j === 0) {
        // Initialize first row.
        row[0] = new Vertex(nop, 0);
        for (let i = 1; i <= aLen; ++i) {
          // Path comes from the cell to the left.
          const edit = this.edits.delete(this.a[i - 1]);
          row[i] = new Vertex(edit, row[i - 1].cost);
        }
        this.matrix[j] = row;
      } else {
        // Initialize first column. Path comes from below.
        const edit = this.edits.insert(this.b[j - 1]);
        row[0] = new Vertex(edit, this.matrix[j - 1][0].cost);
        this.matrix[j] = row;
      }
    }
  }

  // Dynamic programming algorithm fills in best edits and associated costs.
  private forwardPropagate(): void {
    const aLen = this.a.length;
    const bLen = this.b.length;

    for (let j = 1; j <= bLen; ++j) {
      for (let i = 1; i <= aLen; ++i) {
        const a = this.a[i - 1];
        const b = this.b[j - 1];

        // Delete from A
        const v = new Vertex(this.edits.delete(a), this.matrix[j][i - 1].cost);

        // Insert into A
        v.update(this.edits.insert(b), this.matrix[j - 1][i].cost);

        // Repair A
        v.update(this.edits.repair(a, b), this.matrix[j - 1][i - 1].cost);

        this.matrix[j][i] = v;
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
      switch (current.edit.op) {
        case EditOp.DELETE_A:
          edits.unshift(current.edit);
          ai--;
          break;
        case EditOp.INSERT_A:
          edits.unshift(current.edit);
          bi--;
          break;
        case EditOp.REPAIR_A:
          if (current.edit.cost > 0) {
            edits.unshift(current.edit);
          }
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

// TODO: consider returning something other than DiffResults.
export function treeDiff<S, T>(
  costs: IRepairs<S, T>,
  observed: T[],
  expected: T[]
): DiffResults<S> {
  const d = new TreeDiff<S, T>(costs, observed, expected);
  return d.result;
}
