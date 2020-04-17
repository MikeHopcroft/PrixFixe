export interface LogicalItem {
    quantity: number;
    name: string; // TODO: should we retain this field?
    sku: string;
    children: LogicalItem[];
}

export interface LogicalCart {
    items: LogicalItem[];
}

export interface TurnBase {
    speaker: string;
}

export interface TurnTranscription {
    transcription: string;
}

export interface TurnAudio {
    audio: string;
}

export type SpokenTurn = TurnBase & TurnAudio;
export type TextTurn = TurnBase & TurnTranscription;
export type CombinedTurn = TurnBase & TurnAudio & TurnTranscription;
export type AnyTurn = CombinedTurn | SpokenTurn | TextTurn;

export interface Expected {
    cart: LogicalCart;
}

export interface Measures {
    perfect: boolean;
    complete: boolean;
    repairs?: {
        cost: number;
        steps: string[];
    };
}

export interface MeasuresField {
    measures: Measures;
}

export interface Step<TURN> {
    turns: TURN[];
}

export type ValidationStep<TURN> = Step<TURN> & Expected;
export type ScoredStep<TURN> = ValidationStep<TURN> & MeasuresField;

export interface GenericCase<STEP> {
    id: number;
    suites: string;
    comment: string;
    steps: STEP[];
}

export interface GenericSuite<STEP> {
    tests: Array<GenericCase<STEP>>;
}

export type LogicalTestSuite<TURN> = GenericSuite<Step<TURN>>;
export type LogicalValidationSuite<TURN> = GenericSuite<ValidationStep<TURN>>;
export type LogicalScoredSuite<TURN> = GenericSuite<ScoredStep<TURN>>;

// DESIGN NOTE: the type constraint that incorporates Partial<CombinedTurn>
// exists to guide the schema generation to include most of the CombinedTurn
// fields as optional.
export type AnySuite<TURN extends TurnBase & Partial<CombinedTurn>> =
    | LogicalTestSuite<TURN>
    | LogicalValidationSuite<TURN>
    | LogicalScoredSuite<TURN>;

// DESIGN NOTE: this version won't include TURN fields `audio` and
// `transcription`.
// export type AnySuite<TURN extends AnyTurn> =
//     | LogicalTestSuite<TURN>
//     | LogicalValidationSuite<TURN>
//     | LogicalScoredSuite<TURN>;

