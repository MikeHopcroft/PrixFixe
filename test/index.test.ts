import { assert } from 'chai';
import 'mocha';
import { doSomethingElse } from '../src';

describe('Sample test', () => {
    ///////////////////////////////////////////////////////////////////////////////
    //
    //  itemsFromAttributes
    //
    ///////////////////////////////////////////////////////////////////////////////
    it('doSomethingElse', () => {
        assert.equal(doSomethingElse(5), 5);
    });
});
