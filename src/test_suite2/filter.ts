import {
    LogicalCase,
    LogicalTestCase,
    LogicalSuite,
    LogicalValidationCaseTurnByTurn
} from "./interfaces";
import { SuitePredicate } from "../test_suite/suite_filter";

function suiteConverter<
    S1 extends LogicalSuite<LogicalCase<C1>>,
    C1,
    // S2 extends LogicalSuite<LogicalCase<C2>>,
    C2,
>(
    suite: S1,
    suiteFilter: SuitePredicate,
    converter: (input: LogicalCase<C1>) => LogicalCase<C2>
): LogicalSuite<LogicalCase<C2>> {
    const output: Array<LogicalCase<C2>> = [];
    for (const test of suite.tests) {
        const suites = test.suites.split(',').map(x => x.trim());
        if (suiteFilter(suites)) {
            output.push(converter(test));
        }
    }

    return {
        tests: suite.tests.map(converter),
    };
}

function removeCart(
    testCase: LogicalValidationCaseTurnByTurn
): LogicalTestCase {
    const x = {...testCase, cart: undefined};
    return x;
}

