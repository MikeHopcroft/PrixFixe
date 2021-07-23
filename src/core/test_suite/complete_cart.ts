import { LogicalCart, LogicalItem } from './interfaces';

export function cartIsComplete(
  observed: LogicalCart,
  expected: LogicalCart
): boolean {
  const o = canonicalCartLines(observed);
  const e = canonicalCartLines(expected);

  if (o.length !== e.length) {
    // Carts have different line counts.
    return false;
  }

  for (let i = 0; i < o.length; ++i) {
    if (o[i] !== e[i]) {
      // Encountered a difference between the cart lines.
      return false;
    }
  }

  return true;
}

function canonicalCartLines(cart: LogicalCart): string[] {
  const lines: string[] = [];
  for (const item of cart.items) {
    lines.push(...itemLines('', item));
  }
  lines.sort();
  return lines;
}

function* itemLines(
  prefix: string,
  item: LogicalItem
): IterableIterator<string> {
  const current = `${prefix}/${item.quantity}:${item.sku}`;
  yield current;
  for (const child of item.children) {
    yield* itemLines(current, child);
  }
}
