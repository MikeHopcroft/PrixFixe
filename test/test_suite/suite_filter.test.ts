import { assert } from 'chai';
import 'mocha';

import { suiteFilter } from '../../src/test_suite';

describe('suite_filter', () => {
    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Suite Filter
    //
    ///////////////////////////////////////////////////////////////////////////////
    const suites = ['a', 'b', 'c', 'd'];
    const suites2 = ['foo', 'bar', 'foo-bar'];

    it('TERM', () => {
        // Simple TERM
        assert.isTrue(suiteFilter('a')(suites));
        assert.isTrue(suiteFilter('b')(suites));
        assert.isFalse(suiteFilter('x')(suites));
    });

    it('!TERM', () => {
        // Simple !TERM
        assert.isFalse(suiteFilter('!a')(suites));
        assert.isFalse(suiteFilter('!b')(suites));
        assert.isTrue(suiteFilter('!x')(suites));
    });

    it('(TERM)', () => {
        // Simple (TERM)
        assert.isTrue(suiteFilter('(a)')(suites));
        assert.isFalse(suiteFilter('(x)')(suites));
    });

    it('Simple CONJUNCTIONS', () => {
        // Simple CONJUNCTION
        assert.isTrue(suiteFilter('a & b')(suites));
        assert.isTrue(suiteFilter('a & b & c')(suites));
        assert.isFalse(suiteFilter('a & x')(suites));
        assert.isFalse(suiteFilter('a & b & x')(suites));
    });

    it('Simple DISJUNCTIONS', () => {
        // Simple DISJUNCTION
        assert.isTrue(suiteFilter('a | b')(suites));
        assert.isTrue(suiteFilter('a | x')(suites));
        assert.isTrue(suiteFilter('x | y | z | a')(suites));
        assert.isFalse(suiteFilter('x | y')(suites));
    });

    it('Complex NEGATIONS', () => {
        // Complex NEGATION
        assert.isTrue(suiteFilter('!(x & y)')(suites));
        assert.isFalse(suiteFilter('!(a | b)')(suites));
    });

    it('Operator precedence', () => {
        // Operator precedence
        assert.isTrue(suiteFilter('x & a | b')(suites));
        assert.isTrue(suiteFilter('(x & a) | b')(suites));
        assert.isFalse(suiteFilter('x & (a | b)')(suites));
    });

    it('Complex ()', () => {
        // Complex ()
        assert.isTrue(
            suiteFilter('((a | x) & (b | y) & ((c | x) | (d | y)))')(suites)
        );
    });

    it('Multi-character suite names', () => {
        // Suite names
        assert.isTrue(suiteFilter('foo')(suites2));
        assert.isTrue(suiteFilter('bar')(suites2));
        assert.isTrue(suiteFilter('foo-bar')(suites2));
        assert.isTrue(suiteFilter('foo & bar & !baz-baz')(suites2));
    });

    it('White space', () => {
        // White space
        assert.isTrue(suiteFilter('    a   &b & c   ')(suites));
        assert.isTrue(suiteFilter('a&b&c')(suites));
    });

    it('Malformed expressions', () => {
        // Malformed expressions
        assert.throws(() => suiteFilter('(a&b')(suites), "Expected ')'");
        assert.throws(() => suiteFilter('(a|b')(suites), "Expected ')'");
        assert.throws(() => suiteFilter('a&')(suites), 'Expected a suite');
        assert.throws(() => suiteFilter('a |')(suites), 'Expected a suite');
        assert.throws(
            () => suiteFilter('&')(suites),
            'Unexpected operator "&"'
        );
        assert.throws(
            () => suiteFilter('|')(suites),
            'Unexpected operator "|"'
        );
        assert.throws(() => suiteFilter('!')(suites), 'Expected a suite');
        assert.throws(() => suiteFilter('(')(suites), 'Expected a suite');
        assert.throws(
            () => suiteFilter(')')(suites),
            'Unexpected operator ")"'
        );
        assert.throws(
            () => suiteFilter('a b')(suites),
            "Expected '&' or '|' operator"
        );
        assert.throws(
            () => suiteFilter('(a+b))')(suites),
            "Expected '&' or '|' operator"
        );
        assert.throws(() => suiteFilter('')(suites), 'Expected a suite');
        assert.throws(() => suiteFilter('   ')(suites), 'Expected a suite');
    });
});
