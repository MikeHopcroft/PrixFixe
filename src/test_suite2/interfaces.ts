export interface LogicalItem {
    quantity: number;
    name: string; // TODO: should we retain this field?
    sku: string;
    children: LogicalItem[];
}

export interface LogicalCart {
    items: LogicalItem[];
}

export interface LogicalInput {
    input: string;
}

export interface LogicalExpected {
    // TODO: should cart be optional, or should the type system
    // reflect the difference between interim carts and final carts.
    cart?: LogicalCart;
}

export type LogicalTestStep = LogicalInput;
export type LogicalValidationStep = LogicalInput & LogicalExpected;
// export interface LogicalTestStep {
//     input: string;
//     cart?: LogicalCart;
// }

export interface LogicalCase<STEP> {
    // TODO: consider retaining id? Provided by loader, not YAML.
    id: number;
    // TODO: consider string or string[]. Difference between YAML and object.
    suites: string;
    comment: string;
    steps: STEP[];
}

export type LogicalTestCase = LogicalCase<LogicalTestStep>;
export type LogicalValidationCaseTurnByTurn = LogicalCase<
    LogicalValidationStep
>;
export interface LogicalValidationCaseCompleteOrder
    extends LogicalCase<LogicalTestStep> {
    cart: LogicalCart;
}

export interface LogicalMeasures {
    perfect: boolean;
    complete: boolean;
    repairs: {
        cost: number;
        steps: string[];
    };
}

export interface LogicalSuite<CASE> {
    tests: CASE[];
}

export type LogicalTestSuite = 
    LogicalSuite<LogicalTestCase>;
export type LogicalValidationSuiteTurnByTurn = 
    LogicalSuite<LogicalValidationCaseTurnByTurn>;
export type LogicalValidationSuiteCompleteOrder = 
    LogicalSuite<LogicalValidationCaseCompleteOrder>;

// export interface LogicalValidationSuiteTurnByTurn {
//     tests: LogicalValidationCaseTurnByTurn[];
// }

// export interface LogicalValidationSuiteCompleteOrder {
//     tests: LogicalValidationCaseCompleteOrder[];
// }
