import * as style from 'ansi-styles';
import { Cart, ItemInstance } from '../cart';
import { ICatalog } from '../catalog';
import { State } from '../processors';
import { TestLineItem, TestOrder } from '../test_suite';

export function displayState(catalog: ICatalog, state: State) {
  const order: TestOrder = testOrderFromCart(state.cart, catalog);
  const orderText = formatOrder(order);
  if (order.cart.length > 0) {
    console.log(
      `${style.yellow.open}${orderText}${style.yellow.open}${style.reset.open}`
    );
  }
}

export function testOrderFromCart(cart: Cart, catalog: ICatalog): TestOrder {
  const testCart: TestLineItem[] = [];

  for (const item of cart.items) {
    addTestLineItems(catalog, testCart, item, 0);
  }

  return { cart: testCart };
}

function addTestLineItems(
  catalog: ICatalog,
  order: TestLineItem[],
  item: ItemInstance,
  indent: number
): void {
  let name: string;
  let sku: string | undefined;
  if (catalog.hasKey(item.key)) {
    const specific = catalog.getSpecific(item.key);
    name = specific.name;
    sku = specific.sku.toString();
  } else {
    name = `UNKNOWN(${item.key})`;
  }
  const quantity = item.quantity;
  const key = item.key;

  order.push({ indent, quantity, key, name, sku });

  for (const child of item.children) {
    addTestLineItems(catalog, order, child, indent + 1);
  }
}

export function formatOrder(order: TestOrder): string {
  return order.cart.map(formatLineItem).join('\n');
}

function formatLineItem(item: TestLineItem) {
  const leftFieldWidth = 4 + item.indent * 2;
  const left = rightJustify(item.quantity + ' ', leftFieldWidth);

  const rightFieldWidth = 10;
  let right = '';
  right = rightJustify(item.key, rightFieldWidth);

  const totalWidth = 50;
  const middleWidth = Math.max(0, totalWidth - left.length - right.length);
  const middle = leftJustify(`${item.name} (${item.sku})`, middleWidth);
  // const middle = leftJustify(item.name + ' ', middleWidth);

  return `${left}${middle}${right}`;
}

export function leftJustify(text: string, width: number) {
  if (text.length >= width) {
    return text;
  } else {
    const paddingWidth = width - text.length;
    const padding = new Array(paddingWidth + 1).join(' ');
    return text + padding;
  }
}

export function rightJustify(text: string, width: number) {
  if (text.length >= width) {
    return text;
  } else {
    const paddingWidth = width - text.length;
    const padding = new Array(paddingWidth + 1).join(' ');
    return padding + text;
  }
}
