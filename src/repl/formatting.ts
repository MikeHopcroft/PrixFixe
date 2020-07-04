import * as style from 'ansi-styles';
import { Cart, ItemInstance } from '../core/cart';
import { ICatalog } from '../core/catalog';
import { State } from '../core/processors';
import { leftJustify, rightJustify } from '../core/utilities';
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

  return `${left}${middle}${right}`;
}
