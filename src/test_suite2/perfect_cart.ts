import { LogicalCart, LogicalItem } from './interfaces';

export function cartIsPerfect(
  observed: LogicalCart,
  expected: LogicalCart
): boolean {
  const o = flattenCart(observed);
  const e = flattenCart(expected);

  if (o.length !== e.length) {
    // Carts have different line counts.
    return false;
  }

  for (let i = 0; i < o.length; ++i) {
    if (o[i].quantity !== e[i].quantity || o[i].sku !== e[i].sku) {
      // Encountered a difference between carts.
      return false;
    }
  }

  return true;
}

function flattenCart(cart: LogicalCart): LogicalItem[] {
  const items: LogicalItem[] = [];
  for (const item of cart.items) {
    items.push(...flattemItem(item));
  }
  return items;
}

function* flattemItem(item: LogicalItem): IterableIterator<LogicalItem> {
  yield item;
  for (const child of item.children) {
    yield* flattemItem(child);
  }
}
