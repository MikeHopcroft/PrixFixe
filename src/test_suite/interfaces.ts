import { Key } from '../core/catalog';

// Stores aggregations related to test runs by suite or priority.
export interface TestCounts {
  passCount: number;
  runCount: number;
}

export interface TestStep {
  rawSTT: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs: any;
  children?: XmlNode[] | string;
}

// Holds a single line of an TestOrder.
export interface TestLineItem {
  readonly indent: number;
  readonly quantity: number;
  readonly key: Key;
  readonly name: string;
  readonly sku?: string;
}

// TODO: HAs TestOrder been deprecated?
// A simplified view of the Cart, suitable for test verification.
export interface TestOrder {
  readonly cart: TestLineItem[];
}

// DESIGN NOTE: WARNING: must keep the correctionLevelToField array
// from test_suite.ts in sync with the values in CorrectionLevel.
// Also must keep getCorrectionLevel() in sync.
export enum CorrectionLevel {
  Raw,
  STT,
  Scoped,
}
