import { SuitePredicate } from "../test_suite/suite_filter";

import {
    CombinedTurn,
    GenericCase,
    GenericSuite,
    SpokenTurn,
    Step,
    TextTurn,
    ValidationStep,
} from "./interfaces";

export function filterSuite<
    SUITE extends GenericSuite<STEP>,
    STEP
>(
    suite: SUITE,
    suiteFilter: SuitePredicate
): GenericSuite<STEP>
{
    const tests: Array<GenericCase<STEP>> = [];
    for (const test of suite.tests) {
        const suites = test.suites.split(',').map(x => x.trim());
        if (suiteFilter(suites)) {
            tests.push(test);
        }
    }

    return {
        tests,
    };
}

// export type CaseConverter<STEP1, STEP2> =
//     (input: GenericCase<STEP1>) => GenericCase<STEP2>;

// export type StepConverter<TURN1, TURN2> =
//     (input: Step<TURN1>) => Step<TURN2>;

export type CaseConverter<
    STEP1 extends Step<TURN1>,
    TURN1,
    STEP2 extends Step<TURN1>
> = (test: GenericCase<STEP1>) => GenericCase<STEP2>;

export type StepConverter<
    STEP1 extends ValidationStep<TURN1>,
    TURN1,
    STEP2 extends Step<TURN2>,
    TURN2
> = (step: STEP1) => STEP2;

export type TurnConverter<TURN1, TURN2> =
    (turn: TURN1) => TURN2;

export function convertSuite2<
    SUITE extends GenericSuite<STEP1>,
    STEP1 extends ValidationStep<TURN1>,
    STEP2 extends Step<TURN1>,
    TURN1,
    TURN2
>(
    suite: SUITE,
    stepConverter: StepConverter<ValidationStep<TURN1>, TURN1, STEP2, TURN1>,
    turnConverter: TurnConverter<TURN1, TURN2>
): GenericSuite<Step<TURN2>> {
    const tests = suite.tests.map( (test) => {
        // const f = (step: ValidationStep<TURN1>): Step<TURN1> => {
        //     const { ['cart']: _, ...filtered } = step;
        //     return { ...filtered } ;
        // };

        const steps = test.steps.map( (step) => {
            const { ['cart']: _, ...s } = step;
            const s1 = stepConverter(step);
            // const s1 = f(step);
            const turns = s1.turns.map(turnConverter);
            const s2: Step<TURN2> = { ...s1, turns };
            return s2;
            // const {turns, ...s} = stepConverter(step);
            // const t = turns.map(turnConverter);
            // const x: STEP3 = {...s, turns: t};
        });

        return {...test, steps};
    });

    return { tests };
}

function removeCart2<TURN>(v: ValidationStep<TURN>): Step<TURN> {
    const { ['cart']: _, ...step } = v;
    return step;
}

function go2<SUITE>(suite: GenericSuite<ValidationStep<CombinedTurn>>) {
    const x = convertSuite2(suite, removeCart2, removeAudio);
    const y = convertSuite2(suite, removeCart2, removeTranscription);
    // const y = convertSuite(suite, cartRemover(removeTranscription));
}



export function cartRemover<TURN1, TURN2>(
    converter: TurnConverter<TURN1, TURN2>
): StepConverter<ValidationStep<TURN1>, TURN1, Step<TURN2>, TURN2> {
    return (step: ValidationStep<TURN1>): Step<TURN2> => {
        const turns: TURN2[] = step.turns.map(converter);
        const { ['cart']: _, ...filtered } = step;
        return { ...filtered, turns} ;
    };
}

export function removeTranscription(turn: CombinedTurn): SpokenTurn {
    const {['transcription']: _, ...filtered} = turn;
    return filtered;
}

export function removeAudio(turn: CombinedTurn): TextTurn {
    const {['audio']: _, ...filtered} = turn;
    return filtered;
}

export function convertSuite<
    SUITE extends GenericSuite<STEP1>,
    STEP1 extends ValidationStep<TURN1>,
    TURN1,
    STEP2 extends Step<TURN2>,
    TURN2
>(
    suite: SUITE,
    converter: StepConverter<STEP1, TURN1, STEP2, TURN2>
): GenericSuite<STEP2> {
    return {
        tests: suite.tests.map( (test) => {
            const steps = test.steps.map(converter);
            return {...test, steps};
        }),
    };
}

function go<SUITE>(suite: GenericSuite<ValidationStep<CombinedTurn>>) {
    const x = convertSuite(suite, cartRemover(removeAudio));
    const y = convertSuite(suite, cartRemover(removeTranscription));
}

// export function convertSuite<
//     SUITE extends GenericSuite<STEP1>,
//     STEP1,
//     STEP2,
// >(
//     suite: SUITE,
//     converter: (input: GenericCase<STEP1>) => GenericCase<STEP2>
// ): GenericSuite<STEP2> {
//     return {
//         tests: suite.tests.map(converter),
//     };
// }

export function removeCart<TURN>(
    testCase: GenericCase<ValidationStep<TURN>>
): GenericCase<Step<TURN>> {
    const steps = testCase.steps.map( step => {
        const {['cart']: _, ...filtered} = step;
        return filtered;
    });
    return { ...testCase, steps };
}

export function removeCartAndTranscription(
    testCase: GenericCase<ValidationStep<CombinedTurn>>
): GenericCase<Step<SpokenTurn>> {
    const steps = testCase.steps.map( step => {
        const turns = step.turns.map( turn => {
            const {['transcription']: _, ...filtered} = turn;
            return filtered;
        });
        const { ['cart']: _, ...filtered } = step;
        return { ...filtered, turns} ;
    });
    return { ...testCase, steps };
}

export function removeCartAndAudio(
    testCase: GenericCase<ValidationStep<CombinedTurn>>
): GenericCase<Step<TextTurn>> {
    const steps = testCase.steps.map( step => {
        const turns = step.turns.map( turn => {
            const {['audio']: _, ...filtered} = turn;
            return filtered;
        });
        const { ['cart']: _, ...filtered } = step;
        return { ...filtered, turns} ;
    });
    return { ...testCase, steps };
}
