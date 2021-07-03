import { AttributeInfo } from '../attributes';
import { ICatalog } from '../catalog';

import { bipartiteMatchingDiff } from './bipartite_matching_diff';
import { cartSort } from './cart_sort';
import { LogicalCart } from './interfaces';
import { cartFromlogicalCart } from './logical_cart';
import { MenuBasedRepairs } from './menu_based_repairs';
import { RepairFunction } from './scoring';
import { SimpleRepairs } from './simple_repairs';
import { DiffResults } from './tree_diff';

export function createMenuBasedRepairFunction(
  attributeInfo: AttributeInfo,
  catalog: ICatalog
): RepairFunction {
  const repairs = new MenuBasedRepairs(
    attributeInfo,
    catalog,
    bipartiteMatchingDiff
  );
  return (
    observed: LogicalCart,
    expected: LogicalCart
  ): DiffResults<string> => {
    const o = cartFromlogicalCart(cartSort(observed), catalog);
    const e = cartFromlogicalCart(cartSort(expected), catalog);
    return repairs.repairCart(o, e);
  };
}

export function createSimpleRepairFunction(): RepairFunction {
  const repairs = new SimpleRepairs(bipartiteMatchingDiff);
  return (
    observed: LogicalCart,
    expected: LogicalCart
  ): DiffResults<string> => {
    return repairs.repairCart(cartSort(observed), cartSort(expected));
  };
}

export function createNaNRepairFunction(): RepairFunction {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    observed: LogicalCart,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    expected: LogicalCart
  ): DiffResults<string> => {
    return {
      cost: NaN,
      edits: [],
    };
  };
}
