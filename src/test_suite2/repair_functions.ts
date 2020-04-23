import { AttributeInfo } from '../attributes';
import { ICatalog } from '../catalog';
import { LogicalCart } from './interfaces';
import { cartFromlogicalCart } from './logical_cart';
import { RepairFunction } from './scoring';
import { DiffResults } from './tree_diff';
import { TreeRepairs } from './tree_repairs';
import { TreeRepairs2 } from './tree_repairs2';

export function createMenuBasedRepairFunction(
    attributeInfo: AttributeInfo, catalog: ICatalog
): RepairFunction {
    const repairs = new TreeRepairs(attributeInfo, catalog);
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
    const repairs = new TreeRepairs2();
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
