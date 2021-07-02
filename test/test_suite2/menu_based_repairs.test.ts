import { assert } from 'chai';
import 'mocha';

import { AttributeInfo } from '../../src/core/attributes';
import { Cart } from '../../src/core/cart';
import { IdGenerator } from '../../src/core/utilities';

import {
  bipartiteMatchingDiff,
  Edit,
  EditOp,
  MenuBasedRepairs,
} from '../../src/core/test_suite2';

import {
  mediumChocolateCone,
  mediumCoffee,
  mediumDecafCoffee,
  noWhippedCream,
  smallCoffee,
  smallDecafCoffee,
  smallWorldAttributes,
  smallWorldCatalog,
  smallIcedDecafCoffee,
  soyMilk,
  twoMilk,
  whippedCream,
  wholeMilk,
} from '../shared';

const attributeInfo = new AttributeInfo(
  smallWorldCatalog,
  smallWorldAttributes
);

const repairs = new MenuBasedRepairs(
  attributeInfo,
  smallWorldCatalog,
  bipartiteMatchingDiff
  // treeDiff
);

const idGenerator = new IdGenerator();

const cart0: Cart = { items: [] };

const cart1: Cart = {
  items: [
    {
      uid: idGenerator.next(),
      key: smallCoffee.key,
      quantity: 1,
      children: [],
    },
  ],
};

const cart2: Cart = {
  items: [
    cart1.items[0],
    {
      uid: idGenerator.next(),
      key: mediumChocolateCone.key,
      quantity: 2,
      children: [],
    },
  ],
};

const cart3: Cart = {
  items: [
    {
      uid: idGenerator.next(),
      key: smallCoffee.key,
      // NOTE: quanity === 2 for "remove both options"
      // See note below.
      quantity: 2,
      children: [
        {
          uid: idGenerator.next(),
          key: wholeMilk.key,
          quantity: 1,
          children: [],
        },
        {
          uid: idGenerator.next(),
          key: whippedCream.key,
          quantity: 1,
          children: [],
        },
      ],
    },
    {
      uid: idGenerator.next(),
      key: mediumChocolateCone.key,
      quantity: 2,
      children: [],
    },
  ],
};

describe('Menu-based Repairs (Cart)', () => {
  it('add default specific', () => {
    const observed = cart0;
    const expected: Cart = {
      items: [
        {
          uid: 9999,
          key: smallCoffee.key,
          quantity: 1,
          children: [],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.INSERT_A,
        cost: 1,
        steps: ['id(9999): insert default item(small coffee)'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('add non-default specific', () => {
    const observed = cart0;
    const expected: Cart = {
      items: [
        {
          uid: 9000,
          key: smallIcedDecafCoffee.key,
          quantity: 2,
          children: [
            {
              uid: 9001,
              key: twoMilk.key,
              quantity: 1,
              children: [],
            },
          ],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.INSERT_A,
        cost: 5,
        steps: [
          'id(9000): insert default item(small coffee)',
          'id(9000): make item(small coffee) quantity 2',
          'id(9000): change item(small coffee) attribute "hot" to "cold"',
          'id(9000): change item(small coffee) attribute "regular" to "decaf"',
          '  id(9001): insert default item(two percent milk)',
        ],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 5);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('repair non-default specific', () => {
    const observed: Cart = {
      items: [
        {
          uid: 9000,
          key: mediumChocolateCone.key,
          quantity: 2,
          children: [
            {
              uid: 9001,
              key: twoMilk.key,
              quantity: 1,
              children: [],
            },
          ],
        },
      ],
    };

    const expected: Cart = {
      items: [
        {
          uid: 9000,
          key: smallIcedDecafCoffee.key,
          quantity: 2,
          children: [
            {
              uid: 9001,
              key: twoMilk.key,
              quantity: 1,
              children: [],
            },
          ],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 6,
        steps: [
          'id(9000): delete item(medium chocolate cone)',
          'id(9000): insert default item(small coffee)',
          'id(9000): make item(small coffee) quantity 2',
          'id(9000): change item(small coffee) attribute "hot" to "cold"',
          'id(9000): change item(small coffee) attribute "regular" to "decaf"',
          '  id(9001): insert default item(two percent milk)',
        ],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 6);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('remove first item', () => {
    const observed = cart2;
    const expected: Cart = {
      items: [cart2.items[1]],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.DELETE_A,
        cost: 1,
        steps: ['id(1): delete item(small coffee)'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('remove second item', () => {
    const observed = cart2;
    const expected = cart1;

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.DELETE_A,
        cost: 1,
        steps: ['id(2): delete item(medium chocolate cone)'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('remove both items', () => {
    const observed = cart2;
    const expected = cart0;

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.DELETE_A,
        cost: 1,
        steps: ['id(1): delete item(small coffee)'],
      },
      {
        op: EditOp.DELETE_A,
        cost: 1,
        steps: ['id(2): delete item(medium chocolate cone)'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 2);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('identical items', () => {
    const observed = cart1;
    const expected: Cart = {
      items: [
        {
          uid: idGenerator.next(),
          key: smallCoffee.key,
          quantity: 1,
          children: [],
        },
      ],
    };

    const result = repairs.repairCart(observed, expected);
    assert.equal(result.cost, 0);
  });

  it('repair quantity', () => {
    const observed = cart1;
    const expected: Cart = {
      items: [
        {
          uid: idGenerator.next(),
          key: smallCoffee.key,
          quantity: 2,
          children: [],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 1,
        steps: ['id(1): change item(small coffee) quantity to 2'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('repair one attribute', () => {
    const observed = cart1;
    const expected: Cart = {
      items: [
        {
          uid: idGenerator.next(),
          key: smallDecafCoffee.key,
          quantity: 1,
          children: [],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 1,
        steps: [
          'id(1): change item(small coffee) attribute "regular" to "decaf"',
        ],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('repair two attributes', () => {
    const observed = cart1;
    const expected: Cart = {
      items: [
        {
          uid: idGenerator.next(),
          key: mediumDecafCoffee.key,
          quantity: 1,
          children: [],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 2,
        steps: [
          'id(1): change item(small coffee) attribute "small" to "medium"',
          'id(1): change item(small coffee) attribute "regular" to "decaf"',
        ],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 2);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('add option', () => {
    const observed = cart0;
    const expected: Cart = {
      items: [
        {
          uid: 1,
          key: smallCoffee.key,
          quantity: 1,
          children: [
            {
              uid: 9001,
              key: twoMilk.key,
              quantity: 1,
              children: [],
            },
          ],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.INSERT_A,
        cost: 2,
        steps: [
          'id(1): insert default item(small coffee)',
          '  id(9001): insert default item(two percent milk)',
        ],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 2);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('remove first option', () => {
    const observed = cart3;
    const expected: Cart = {
      items: [
        {
          ...cart3.items[0],
          children: [cart3.items[0].children[1]],
        },
        cart3.items[1],
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 1,
        steps: ['  id(4): delete item(whole milk)'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('remove second option', () => {
    const observed = cart3;
    const expected: Cart = {
      items: [
        {
          ...cart3.items[0],
          children: [cart3.items[0].children[0]],
        },
        cart3.items[1],
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 1,
        steps: ['  id(5): delete item(with whipped cream)'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('remove both options', () => {
    const observed = cart3;
    const expected: Cart = {
      items: [
        {
          ...cart3.items[0],
          children: [],
        },
        cart3.items[1],
      ],
    };

    // NOTE: if the quantity of 9000:0:0:0 were 1, it would be just as easy
    // to delete the 9000:0:0:0 and add it again. The test uses a quantity
    // of 2 so that the expected edits are to remove the options.
    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 2,
        steps: [
          '  id(4): delete item(whole milk)',
          '  id(5): delete item(with whipped cream)',
        ],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 2);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('repair option attributes', () => {
    const observed = cart3;
    const expected: Cart = {
      items: [
        {
          uid: idGenerator.next(),
          key: smallCoffee.key,
          // NOTE: quanity === 2 for "remove both options"
          // See note below.
          quantity: 2,
          children: [
            {
              uid: idGenerator.next(),
              key: wholeMilk.key,
              quantity: 1,
              children: [],
            },
            {
              uid: idGenerator.next(),
              key: noWhippedCream.key, // CHANGED ATTRIBUTE
              quantity: 1,
              children: [],
            },
          ],
        },
        {
          uid: idGenerator.next(),
          key: mediumChocolateCone.key,
          quantity: 2,
          children: [],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 1,
        steps: [
          '  id(5): change item(with whipped cream) attribute "regular" to "no"',
        ],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });

  it('repair option quantity', () => {
    const observed = cart3;
    const expected: Cart = {
      items: [
        {
          uid: idGenerator.next(),
          key: smallCoffee.key,
          // NOTE: quanity === 2 for "remove both options"
          // See note below.
          quantity: 2,
          children: [
            {
              uid: idGenerator.next(),
              key: wholeMilk.key,
              quantity: 5, // CHANGED QUANTITY
              children: [],
            },
            {
              uid: idGenerator.next(),
              key: whippedCream.key,
              quantity: 1,
              children: [],
            },
          ],
        },
        {
          uid: idGenerator.next(),
          key: mediumChocolateCone.key,
          quantity: 2,
          children: [],
        },
      ],
    };

    const expectedEdits: Array<Edit<string>> = [
      {
        op: EditOp.REPAIR_A,
        cost: 1,
        steps: ['  id(4): change item(whole milk) quantity to 5'],
      },
    ];

    const result = repairs.repairCart(observed, expected);

    assert.equal(result.cost, 1);
    assert.deepEqual(result.edits, expectedEdits);
  });
});
