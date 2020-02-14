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

export interface Step<TURN> {
    turns: TURN[];
}

export type ValidationStep<TURN> = Step<TURN> & Expected;
export type ScoredStep<TURN> = ValidationStep<TURN> & Measures;

export interface GenericCase<STEP> {
    // TODO: consider retaining id? Provided by loader, not YAML.
    id: number;
    // TODO: consider string or string[]. Difference between YAML and object.
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

export type AnySuite<TURN> =
    | LogicalTestSuite<TURN>
    | LogicalValidationSuite<TURN>
    | LogicalScoredSuite<TURN>;
