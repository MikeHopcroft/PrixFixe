import { LogicalCart, LogicalItem } from './interfaces';

// Sorts LogicalItems and their children into a canonical ordering used to
// compute the cost of repainr to complete state (vs perfect repair).
export function cartSort(cart: LogicalCart): LogicalCart {
  return { items: itemSort(cart.items) };
}

function itemSort(items: LogicalItem[]): LogicalItem[] {
  const copy = items.map((item) => {
    return { ...item, children: itemSort(item.children) };
  });

  copy.sort(compareItems);

  return copy;
}

function compareItems(a: LogicalItem, b: LogicalItem): number {
  let d = a.sku.localeCompare(b.sku);
  if (d) {
    return d;
  }

  d = a.quantity - b.quantity;
  if (d) {
    return d;
  }

  d = a.children.length - b.children.length;
  if (d) {
    return d;
  }

  for (let i = 0; i < a.children.length; ++i) {
    d = compareItems(a.children[i], b.children[i]);
    if (d) {
      return d;
    }
  }

  return 0;
}
