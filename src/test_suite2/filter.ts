import { SuitePredicate, suiteFilter } from '../test_suite/suite_filter';

import {
    CombinedTurn,
    GenericSuite,
    SpokenTurn,
    Step,
    TextTurn,
    ValidationStep,
} from './interfaces';

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
    suiteFilter: SuitePredicate,
    stepConverter: StepConverter<ValidationStep<TURN1>, TURN1, STEP2, TURN1>,
    turnConverter: TurnConverter<TURN1, TURN2>
): GenericSuite<Step<TURN2>> {
    const s = suite.tests.filter(test => suiteFilter(test.suites.split(/\s+/)));
    const tests = s.map(test => {
        const steps = test.steps.map(step => {
            const s = stepConverter(step);
            const turns = s.turns.map(turnConverter);
            return { ...s, turns };
        });

        return { ...test, steps };
    });

    return { tests };
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

export function filterSuite<SUITE extends GenericSuite<STEP>, STEP>(
    suite: SUITE,
    suiteFilter: SuitePredicate
): GenericSuite<STEP> {
    const tests = suite.tests.filter(test => {
        const suites = test.suites.split(',').map(x => x.trim());
        return suiteFilter(suites);
    });

    return {
        tests,
    };
}
