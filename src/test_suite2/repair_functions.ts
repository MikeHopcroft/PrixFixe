import { AttributeInfo } from '../attributes';
import { ICatalog } from '../catalog';
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
    const repairs = new MenuBasedRepairs(attributeInfo, catalog);
    return (
        observed: LogicalCart,
        expected: LogicalCart
    ): DiffResults<string> => {
        const o = cartFromlogicalCart(observed, catalog);
        const e = cartFromlogicalCart(expected, catalog);
        return repairs.repairCart(o, e);
    };
}

export function createSimpleRepairFunction(): RepairFunction {
    const repairs = new SimpleRepairs();
    return (
        observed: LogicalCart,
        expected: LogicalCart
    ): DiffResults<string> => {
        return repairs.repairCart(observed, expected);
    };
}

export function createNaNRepairFunction(): RepairFunction {
    return (
        observed: LogicalCart,
        expected: LogicalCart
    ): DiffResults<string> => {
        return {
            cost: NaN,
            edits: [],
        };
    };
}
