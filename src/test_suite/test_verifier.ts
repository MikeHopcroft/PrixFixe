import { ICatalog } from '../core/catalog';
import { IRuleChecker } from '../core/rule_checker';

import { TestLineItem, TestStep } from './interfaces';

import { TestCase, TestSuite } from './test_suite';

// class TestStepVerifier {
//     catalog: ICatalog;
//     rules: IRuleChecker;

//     currentLine = 0;
//     fixedLines: TestLineItem[] = [];

//     constructor(
//         step: TestStep,
//         catalog: ICatalog,
//         rules: IRuleChecker
//     ) {
//         this.catalog = catalog;
//         this.rules = rules;

//         while (this.currentLine < step.cart.length) {
//             this.verifyProduct(step.cart);
//         }
//     }

//     private verifyProduct(cart: TestLineItem[]) {
//         const parent = cart[this.currentLine++];
//         const f = this.rules.getIncrementalMutualExclusionPredicate(parent.key);

//         while (this.currentLine < cart.length) {
//             const child = cart[this.currentLine];
//             if (child.indent === 0) {
//                 break;
//             }

//             this.currentLine++;

//             if (!f(child.key)) {
//                 console.log(`${child.key} cannot be a child of ${parent.key}`);
//             }
//         }
//     }
// }

let errorCount = 0;

function verifyTestStep(
  step: TestStep,
  catalog: ICatalog,
  rules: IRuleChecker
): TestStep {
  let fixedSomething = false;
  const lines: TestLineItem[] = [];
  const cart = step.cart;
  let currentLine = 0;

  while (currentLine < cart.length) {
    const parent = cart[currentLine++];
    lines.push(parent);
    //        const f = rules.getIncrementalMutualExclusionPredicate(parent.key);

    while (currentLine < cart.length) {
      const child = cart[currentLine];
      if (child.indent === 0) {
        break;
      }

      currentLine++;

      // TODO: check for incorrect name - fixup if possible
      // TODO: check for mutual exclusion
      // if (!f(child.key)) {
      if (!rules.isValidChild(parent.key, child.key)) {
        errorCount++;
        console.log(
          // TODO: print out more information here, like the name of the
          // parent and child.
          `${errorCount}: "${child.key}" cannot be a child of "${parent.key}"`
        );

        fixedSomething = true;

        // TODO: make the fix here.
        // TODO: mark suites with invalid if fix cannot be made
        lines.push(child);
      } else {
        lines.push(child);
      }
    }
  }

  if (fixedSomething) {
    return { ...step, cart: lines };
  } else {
    return step;
  }
}

function verifyTestCase(
  test: TestCase,
  catalog: ICatalog,
  rules: IRuleChecker
): TestCase {
  let fixedSomething = false;
  const steps: TestStep[] = [];

  for (const step of test.steps) {
    const step2 = verifyTestStep(step, catalog, rules);

    if (step !== step2) {
      fixedSomething = true;
      steps.push(step2);
    } else {
      steps.push(step);
    }
  }

  if (fixedSomething) {
    return new TestCase(test.id, test.suites, test.comment, steps);
  } else {
    return test;
  }
}

export function verifyTestSuite(
  suite: TestSuite,
  catalog: ICatalog,
  rules: IRuleChecker
): TestSuite {
  let fixedSomething = false;
  const tests: TestCase[] = [];

  for (const test of suite.tests) {
    const test2 = verifyTestCase(test, catalog, rules);

    if (test !== test2) {
      fixedSomething = true;
      tests.push(test2);
    } else {
      tests.push(test);
    }
  }

  if (fixedSomething) {
    return new TestSuite(tests);
  } else {
    return suite;
  }
}
