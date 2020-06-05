import { SuitePredicate } from '../test_suite/suite_predicate';

import {
  CombinedTurn,
  GenericCase,
  GenericSuite,
  SpokenTurn,
  Step,
  TextTurn,
  ValidationStep,
} from './interfaces';

export type TestCasePredicate<STEP extends ValidationStep<TURN>, TURN> = (
  test: GenericCase<STEP>
) => boolean;

export type StepConverter<
  STEP1 extends ValidationStep<TURN1>,
  TURN1,
  STEP2 extends Step<TURN2>,
  TURN2
> = (step: STEP1) => STEP2;

export type TurnConverter<TURN1, TURN2> = (turn: TURN1) => TURN2;

export function convertSuite<
  SUITE extends GenericSuite<STEP1>,
  STEP1 extends ValidationStep<TURN1>,
  STEP2 extends Step<TURN1>,
  TURN1,
  TURN2
>(
  suite: SUITE,
  testCasePredicate: TestCasePredicate<STEP1, TURN1>,
  stepConverter: StepConverter<ValidationStep<TURN1>, TURN1, STEP2, TURN1>,
  turnConverter: TurnConverter<TURN1, TURN2>
): GenericSuite<Step<TURN2>> {
  const s1 = filterSuite(suite, testCasePredicate);
  const s2 = mapSuite(s1, (test: GenericCase<STEP1>) => {
    const steps = test.steps.map(step => {
      const s = stepConverter(step);
      const turns = s.turns.map(turnConverter);
      return { ...s, turns };
    });

    return { ...test, steps };
  });

  return s2;
}

export function filterSuite<
  SUITE extends GenericSuite<STEP1>,
  STEP1 extends ValidationStep<TURN1>,
  TURN1
>(suite: SUITE, predicate: TestCasePredicate<STEP1, TURN1>): SUITE {
  const tests: typeof suite.tests = [];
  for (const test of suite.tests) {
    if ('id' in test) {
      if (predicate(test)) {
        tests.push(test);
      }
    } else {
      tests.push(filterSuite(test, predicate));
    }
  }
  return { ...suite, tests };
}

export function mapSuite<
  STEP1 extends ValidationStep<TURN1>,
  STEP2 extends Step<TURN1>,
  TURN1
>(
  suite: GenericSuite<STEP1>,
  convert: (a: GenericCase<STEP1>) => GenericCase<STEP2>
): GenericSuite<STEP2> {
  const tests: Array<GenericCase<STEP2> | GenericSuite<STEP2>> = [];
  for (const test of suite.tests) {
    if ('id' in test) {
      tests.push(convert(test));
    } else {
      tests.push(mapSuite(test, convert));
    }
  }

  if (suite.comment) {
    return {
      ...suite,
      comment: suite.comment,
      tests,
    };
  } else {
    return { ...suite, tests };
  }
}

export async function mapSuiteAsync<
  STEP1 extends ValidationStep<TURN1>,
  STEP2 extends Step<TURN1>,
  TURN1
>(
  suite: GenericSuite<STEP1>,
  convert: (a: GenericCase<STEP1>) => Promise<GenericCase<STEP2>>
): Promise<GenericSuite<STEP2>> {
  const tests: Array<GenericCase<STEP2> | GenericSuite<STEP2>> = [];
  for (const test of suite.tests) {
    if ('id' in test) {
      tests.push(await convert(test));
    } else {
      tests.push(await mapSuiteAsync(test, convert));
    }
  }

  if (suite.comment) {
    return {
      comment: suite.comment,
      tests,
    };
  } else {
    return { tests };
  }
}

export function* enumerateTestCases<STEP1>(
  suite: GenericSuite<STEP1>
): IterableIterator<GenericCase<STEP1>> {
  for (const test of suite.tests) {
    if ('id' in test) {
      yield test;
    } else {
      yield* enumerateTestCases(test);
    }
  }
}

export function allCases<STEP extends ValidationStep<TURN>, TURN>(
  test: GenericCase<STEP>
) {
  return true;
}

export function removeCart<TURN>(v: ValidationStep<TURN>): Step<TURN> {
  const { ['cart']: _, ...step } = v;
  return step;
}

export function keepCart<TURN>(v: ValidationStep<TURN>): Step<TURN> {
  return v;
}

export function removeTranscription(turn: CombinedTurn): SpokenTurn {
  const { ['transcription']: _, ...filtered } = turn;
  return filtered;
}

export function keepTranscription(turn: CombinedTurn): CombinedTurn {
  return turn;
}

export function removeAudio(turn: CombinedTurn): TextTurn {
  const { ['audio']: _, ...filtered } = turn;
  return filtered;
}

export function keepAudio(turn: CombinedTurn): CombinedTurn {
  return turn;
}

export function suitePredicateFilter<STEP extends ValidationStep<TURN>, TURN>(
  p: SuitePredicate
): TestCasePredicate<STEP, TURN> {
  return test => p(test.suites.split(/\s+/));
}
