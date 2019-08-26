import { Key } from '../catalog';

// Stores aggregations related to test runs by suite or priority.
export interface TestCounts {
    passCount: number;
    runCount: number;
}

export interface TestStep {
    input: string;
    correctedSTT?: string;
    correctedScope?: string;
    cart: TestLineItem[];
}

export interface YamlTestCase {
    suites: string;
    comment: string;
    steps: TestStep[];
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
    readonly cart: TestLineItem[];
}
