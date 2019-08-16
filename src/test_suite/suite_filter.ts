import { PeekableSequence } from './peekable_sequence';

type SuitePredicate = (suites: string[]) => boolean;

// Constructs a SuitePredicate from a a textual boolean expression
// over suite names. The expression can be made up of
//   TERM: a suite name - any sequence of non-space characters that
//         does not include the symbols '(', ')', '&', '|', and '!'
//   LOGICAL OR: '|'
//   LOGICAL AND: '&'
//   LOGICAL NEGATION: '!'
//   PARENTHESES: '(', ')'
//
// The SuitePredicate takes a single parameter that is an array of
// TERMS, each of which is considered to have a true value. It returns
// the truth value of the expression.
export function suiteFilter(text: string): SuitePredicate {
    // Tokenzize the input string.
    // The result should be an array of suite names, and symbols '(', ')', '&',
    // '|', and '!'.
    const re = new RegExp('s*([\\s+|\\&\\|\\!\\(\\)])');
    const tokens = text
        .split(re)
        .map(x => x.trim())
        .filter(x => x.length > 0);

    // Create a stream of tokens.
    const input = new PeekableSequence<string>(tokens.values());

    return parseDisjunction(input);
}

// CONJUNCTION [| DISJUNCTION]*
function parseDisjunction(input: PeekableSequence<string>): SuitePredicate {
    const children: SuitePredicate[] = [parseConjunction(input)];
    while (!input.atEOS()) {
        if (input.peek() === ')') {
            break;
        } else if (input.peek() === '|') {
            input.get();
            children.push(parseConjunction(input));
        } else {
            const message = "Expected '&' or '|' operator";
            throw TypeError(message);
        }
    }

    if (children.length === 1) {
        return children[0];
    } else {
        return (suites: string[]) => {
            for (const child of children) {
                if (child(suites)) {
                    return true;
                }
            }
            return false;
        };
    }
}

// UNARY [& CONJUNCTION]*
function parseConjunction(input: PeekableSequence<string>): SuitePredicate {
    const children: SuitePredicate[] = [parseUnary(input)];
    while (!input.atEOS()) {
        if (input.peek() === ')') {
            break;
        } else if (input.peek() === '&') {
            input.get();
            children.push(parseConjunction(input));
        } else {
            break;
        }
    }

    if (children.length === 1) {
        return children[0];
    } else {
        return (suites: string[]) => {
            for (const child of children) {
                if (!child(suites)) {
                    return false;
                }
            }
            return true;
        };
    }
}

// TERM | !TERM
function parseUnary(input: PeekableSequence<string>): SuitePredicate {
    if (input.nextIs('!')) {
        input.get();
        const unary = parseDisjunction(input);
        return (suites: string[]) => !unary(suites);
    } else if (input.nextIs('(')) {
        input.get();
        const unary = parseDisjunction(input);
        if (!input.nextIs(')')) {
            const message = "Expected ')'";
            throw TypeError(message);
        }
        input.get();
        return unary;
    } else {
        return parseTerm(input);
    }
}

// TERM
function parseTerm(input: PeekableSequence<string>): SuitePredicate {
    if (!input.atEOS()) {
        const next = input.peek();
        if (['&', '|', '!', '(', ')'].includes(next)) {
            const message = `Unexpected operator "${next}"`;
            throw TypeError(message);
        }
        const suite = input.get();
        return (suites: string[]) => suites.includes(suite);
    } else {
        const message = 'Expected a suite';
        throw TypeError(message);
    }
}
