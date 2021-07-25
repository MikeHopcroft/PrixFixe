import { assert } from 'chai';
import 'mocha';

import { QuantityInformation, RuleChecker } from '../../../src';

describe('core/rules', () => {
  it('isValidChild()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    rules.addChild(1, 101);
    rules.addChild(1, 102);
    rules.addChild(2, 201);

    assert.isTrue(rules.isValidChild('1:1000:2000', '101:3000:4000'));
    assert.isTrue(rules.isValidChild('1:1000:2000', '102:3000:4000'));
    assert.isTrue(rules.isValidChild('2:1000:2000', '201:3000:4000'));

    assert.isFalse(rules.isValidChild('2:1000:2000', '101:3000:4000'));
  });

  it('getValidChildren()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    rules.addChild(1, 101);
    rules.addChild(1, 102);
    rules.addChild(2, 201);

    assert.sameMembers([...rules.getValidChildren('1:1000:2000')], [101, 102]);
    assert.sameMembers([...rules.getValidChildren('2:1000:2000')], [201]);
    assert.sameMembers([...rules.getValidChildren('3:1000:2000')], []);
  });

  it('getPairwiseMutualExclusionPredicate()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    rules.addExclusionSet(1, new Set([101, 102]));
    rules.addExclusionSet(1, new Set([301, 302]));

    const p1a = rules.getPairwiseMutualExclusionPredicate(
      '1:1000:2000',
      '101:3000:4000'
    );
    assert.isFalse(p1a('101:3000:4000')); // Exclusive with self
    assert.isFalse(p1a('102:3000:4000')); // Exclusive with items in exclusion set
    assert.isTrue(p1a('301:3000:4000')); // Ok with other items

    const p1b = rules.getPairwiseMutualExclusionPredicate(
      '1:1000:2000',
      '301:3000:4000'
    );
    assert.isFalse(p1b('301:3000:4000')); // Exclusive with self
    assert.isFalse(p1b('302:3000:4000')); // Exclusive with items in exclusion set
    assert.isTrue(p1b('101:3000:4000')); // Ok with other items

    const p2 = rules.getPairwiseMutualExclusionPredicate(
      '2:1000:2000',
      '201:3000:4000'
    );
    assert.isFalse(p2('201:3000:4000')); // Exclusive with self
    assert.isTrue(p2('202:3000:4000')); // Ok with child not in exclusion set
  });

  it('getIncrementalMutualExclusionPredicate()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    rules.addExclusionSet(1, new Set([101, 102]));
    rules.addExclusionSet(1, new Set([301, 302]));

    const p = rules.getIncrementalMutualExclusionPredicate('1:1000:2000');
    assert.isTrue(p('101:3000:4000')); // First child always valid
    assert.isFalse(p('101:3000:4000')); // Duplicate PID not valild
    assert.isFalse(p('102:3000:4000')); // Second in exclusion set
    assert.isTrue(p('301:3000:4000')); // First in another exlusion set
    assert.isFalse(p('302:3000:4000')); // Second in exclusion set
  });

  it('getExclusionGroups()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    const s100 = [101, 102];
    rules.addExclusionSet(1, new Set(s100));
    const s300 = [301, 302];
    rules.addExclusionSet(1, new Set(s300));

    const g1 = rules.getExclusionGroups(1).map((x) => [...x]);
    assert.sameDeepMembers(g1, [s100, s300]);

    const g2 = rules.getExclusionGroups(2);
    assert.sameMembers(g2, []);
  });

  it('getDefaultQuantity()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    rules.addQuantityInfo(1, 101, {
      defaultQty: 2,
      maxQty: 3,
      minQty: 1,
    });

    assert.equal(rules.getDefaultQuantity('1:1000:2000', '101:3000:4000'), 2);
    assert.throws(() =>
      rules.getDefaultQuantity('2:1000:2000', '101:3000:4000')
    );
  });

  it('isValidQuantity()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    rules.addQuantityInfo(1, 101, {
      defaultQty: 2,
      maxQty: 3,
      minQty: 1,
    });

    assert.isFalse(rules.isValidQuantity('1:1000:2000', '101:3000:4000', 0));
    assert.isTrue(rules.isValidQuantity('1:1000:2000', '101:3000:4000', 1));
    assert.isTrue(rules.isValidQuantity('1:1000:2000', '101:3000:4000', 2));
    assert.isTrue(rules.isValidQuantity('1:1000:2000', '101:3000:4000', 3));
    assert.isFalse(rules.isValidQuantity('1:1000:2000', '101:3000:4000', 4));
  });

  it('getQuantityInfo()', () => {
    const rules = new RuleChecker(new Map<number, string>());
    const info: QuantityInformation = {
      defaultQty: 2,
      maxQty: 3,
      minQty: 1,
    };
    rules.addQuantityInfo(1, 101, info);

    assert.equal(rules.getQuantityInfo('1:1000:2000', '101:3000:4000'), info);

    assert.equal(
      rules.getQuantityInfo('1:1000:2000', '102:3000:4000'),
      undefined
    );
  });

  it('getUnits()', () => {
    const rules = new RuleChecker(
      new Map<number, string>([
        [1, 'shots'],
        [2, 'pieces'],
      ])
    );
    assert.equal(rules.getUnits(1), 'shots');
    assert.equal(rules.getUnits(2), 'pieces');
    assert.equal(rules.getUnits(3), '');
  });
});
