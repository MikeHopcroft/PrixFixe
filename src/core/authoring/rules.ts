import { PID } from '../catalog';
import { IRuleChecker, QuantityInformation, RuleChecker } from '../rules';

import { AnyRule } from './types';

export function processRules(
  tagsToPIDs: Map<string, PID[]>,
  pidsToUnits: Map<PID, string>,
  rules: AnyRule[]
): IRuleChecker {
  const ruleChecker = new RuleChecker(pidsToUnits);

  for (const rule of rules) {
    if ('children' in rule) {
      processParentChild(
        ruleChecker,
        tagsToPIDs,
        rule.parents,
        rule.children,
        rule.info
      );
    } else {
      processExclusions(ruleChecker, tagsToPIDs, rule.parents, rule.exclusive);
    }
  }

  return ruleChecker;
}

function processParentChild(
  rules: RuleChecker,
  tagsToPIDs: Map<string, PID[]>,
  parentTags: string[],
  childrenTags: string[],
  info: QuantityInformation | undefined
) {
  const parents = new Set<PID>();
  for (const tag of parentTags) {
    const pList = tagsToPIDs.get(tag) || [];
    for (const p of pList) {
      parents.add(p);
    }
  }

  const children = new Set<PID>();
  for (const tag of childrenTags) {
    const cList = tagsToPIDs.get(tag) || [];
    for (const c of cList) {
      children.add(c);
    }
  }

  for (const p of parents) {
    for (const c of children) {
      rules.addChild(p, c);
      rules.addQuantityInfo(p, c, info);
    }
  }
}

function processExclusions(
  rules: RuleChecker,
  tagsToPIDs: Map<string, PID[]>,
  parentTags: string[],
  exclusiveTags: string[]
) {
  const parents = new Set<PID>();
  for (const tag of parentTags) {
    const pList = tagsToPIDs.get(tag) || [];
    for (const p of pList) {
      parents.add(p);
    }
  }

  // TODO: REVIEW semantics - do we want to create one exclusion set per tag
  // or one combined exclusion set?
  const exclusionSets: Array<Set<PID>> = [];
  for (const tag of exclusiveTags) {
    const cList = tagsToPIDs.get(tag) || [];
    const exclusions = new Set<PID>();
    for (const c of cList) {
      exclusions.add(c);
    }
    exclusionSets.push(exclusions);
  }

  for (const p of parents) {
    for (const e of exclusionSets) {
      rules.addExclusionSet(p, e);
    }
  }
}
