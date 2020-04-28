import { assert } from 'chai';
import 'mocha';

import { suitePredicate } from '../../src/test_suite';

describe('Suite Predicate', () => {
    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Suite Filter
    //
    ///////////////////////////////////////////////////////////////////////////////
    const suites = ['a', 'b', 'c', 'd'];
    const suites2 = ['foo', 'bar', 'foo-bar'];

    it('TERM', () => {
        // Simple TERM
        assert.isTrue(suitePredicate('a')(suites));
        assert.isTrue(suitePredicate('b')(suites));
        assert.isFalse(suitePredicate('x')(suites));
    });

    it('!TERM', () => {
        // Simple !TERM
        assert.isFalse(suitePredicate('!a')(suites));
        assert.isFalse(suitePredicate('!b')(suites));
        assert.isTrue(suitePredicate('!x')(suites));
    });

    it('(TERM)', () => {
        // Simple (TERM)
        assert.isTrue(suitePredicate('(a)')(suites));
        assert.isFalse(suitePredicate('(x)')(suites));
    });

    it('Simple CONJUNCTIONS', () => {
        // Simple CONJUNCTION
        assert.isTrue(suitePredicate('a & b')(suites));
        assert.isTrue(suitePredicate('a & b & c')(suites));
        assert.isFalse(suitePredicate('a & x')(suites));
        assert.isFalse(suitePredicate('a & b & x')(suites));
    });

    it('Simple DISJUNCTIONS', () => {
        // Simple DISJUNCTION
        assert.isTrue(suitePredicate('a | b')(suites));
        assert.isTrue(suitePredicate('a | x')(suites));
        assert.isTrue(suitePredicate('x | y | z | a')(suites));
        assert.isFalse(suitePredicate('x | y')(suites));
    });

    it('Complex NEGATIONS', () => {
        // Complex NEGATION
        assert.isTrue(suitePredicate('!(x & y)')(suites));
        assert.isFalse(suitePredicate('!(a | b)')(suites));

        // Next line was a bug detected in v0.0.42.
        assert.isFalse(suitePredicate('!a & !x')(suites));
        assert.isTrue(suitePredicate('!x & !y')(suites));
        assert.isFalse(suitePredicate('!a & !b')(suites));
        assert.isFalse(suitePredicate('!x & !b')(suites));

        assert.isTrue(suitePredicate('!!a')(suites));
        assert.isFalse(suitePredicate('!!!a')(suites));
    });

    it('Operator precedence', () => {
        // Operator precedence
        assert.isTrue(suitePredicate('x & a | b')(suites));
        assert.isTrue(suitePredicate('(x & a) | b')(suites));
        assert.isFalse(suitePredicate('x & (a | b)')(suites));
    });

    it('Complex ()', () => {
        // Complex ()
        assert.isTrue(
            suitePredicate('((a | x) & (b | y) & ((c | x) | (d | y)))')(suites)
        );
    });

    it('Multi-character suite names', () => {
        // Suite names
        assert.isTrue(suitePredicate('foo')(suites2));
        assert.isTrue(suitePredicate('bar')(suites2));
        assert.isTrue(suitePredicate('foo-bar')(suites2));
        assert.isTrue(suitePredicate('foo & bar & !baz-baz')(suites2));
    });

    it('White space', () => {
        // White space
        assert.isTrue(suitePredicate('    a   &b & c   ')(suites));
        assert.isTrue(suitePredicate('a&b&c')(suites));
    });

    it('Malformed expressions', () => {
        // Malformed expressions
        assert.throws(() => suitePredicate('(a&b')(suites), "Expected ')'");
        assert.throws(() => suitePredicate('(a|b')(suites), "Expected ')'");
        assert.throws(() => suitePredicate('a&')(suites), 'Expected a suite');
        assert.throws(() => suitePredicate('a |')(suites), 'Expected a suite');
        assert.throws(
            () => suitePredicate('&')(suites),
            'Unexpected operator "&"'
        );
        assert.throws(
            () => suitePredicate('|')(suites),
            'Unexpected operator "|"'
        );
        assert.throws(() => suitePredicate('!')(suites), 'Expected a suite');
        assert.throws(() => suitePredicate('(')(suites), 'Expected a suite');
        assert.throws(
            () => suitePredicate(')')(suites),
            'Unexpected operator ")"'
        );
        assert.throws(
            () => suitePredicate('a b')(suites),
            "Expected '&' or '|' operator"
        );
        assert.throws(
            () => suitePredicate('(a+b))')(suites),
            "Expected '&' or '|' operator"
        );
        assert.throws(() => suitePredicate('')(suites), 'Expected a suite');
        assert.throws(() => suitePredicate('   ')(suites), 'Expected a suite');
    });
});
