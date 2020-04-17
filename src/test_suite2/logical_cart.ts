import { Cart, ItemInstance } from '../cart';
import { ICatalog } from '../catalog';
import { IDGenerator } from '../utilities';

import { LogicalCart, LogicalItem } from './interfaces';

export function logicalCartFromCart(
    cart: Cart,
    catalog: ICatalog
): LogicalCart {
    return {
        items: cart.items.map(item =>
            logicalItemFromItemInstance(item, catalog)
        ),
    };
}

function logicalItemFromItemInstance(
    item: ItemInstance,
    catalog: ICatalog
): LogicalItem {
    const specific = catalog.getSpecific(item.key);

    return {
        quantity: item.quantity,
        name: specific.name,
        sku: specific.sku.toString(),
        children: item.children.map(child =>
            logicalItemFromItemInstance(child, catalog)
        ),
    };
}

export function cartFromlogicalCart(
    cart: LogicalCart,
    catalog: ICatalog
): Cart {
    return {
        items: cart.items.map(item =>
            itemInstanceFromLogicalItem(item, catalog)
        ),
    };
}

const idGenerator = new IDGenerator();

function itemInstanceFromLogicalItem(
    item: LogicalItem,
    catalog: ICatalog
): ItemInstance {
    const specific = catalog.getSpecificFromSKU(item.sku);

    return {
        uid: idGenerator.nextId(),
        quantity: item.quantity,
        key: specific.key,
        children: item.children.map(
            child => itemInstanceFromLogicalItem(child, catalog)
        ),
    };
}
