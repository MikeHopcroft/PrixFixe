import { Key } from '../catalog';

// Stores aggregations related to test runs by suite or priority.
export interface TestCounts {
    passCount: number;
    runCount: number;
}

export interface TestSteps {
    input: string;
    correctedSTT?: string;
    correctedScope?: string;
    cart: TestOrder;
}

export interface YamlTestCase {
    suites: string;
    comment: string;
    steps: TestSteps[];
}

export interface XmlNode {
    name: string;
    // tslint:disable-next-line: no-any
    attrs: any;
    children?: XmlNode[] | string;
}

// Holds a single line of an TestOrder.
export interface TestLineItem {
    readonly indent: number;
    readonly quantity: number;
    readonly key: Key;
    readonly name: string;
}

// A simplified view of the Cart, suitable for test verification.
export interface TestOrder {
    readonly lines: TestLineItem[];
}
