import { Cart, ItemInstance, AID } from '../../src/cart/interfaces';

export const bread0: ItemInstance = {
    uid: 0,
    pid: 0,
    name: 'Hamburger Bun',
    aliases: ['Bun', 'Bread'],
    key: 'a',
    quantity: 1,
    children: [],
};

export const bread1: ItemInstance = {
    uid: 1,
    pid: 0,
    name: 'Hamburger Bun',
    aliases: ['Bun', 'Bread'],
    key: 'a',
    quantity: 1,
    children: [],
};

export const lettuce2: ItemInstance = {
    uid: 2,
    pid: 1,
    name: 'Lettuce',
    aliases: ['Iceberg'],
    key: 'c',
    quantity: 1,
    children: [],
};

export const lettuce3: ItemInstance = {
    uid: 3,
    pid: 1,
    name: 'Lettuce',
    aliases: ['Iceberg'],
    key: 'c',
    quantity: 2,
    children: [],
};

export const coke5: ItemInstance = {
    uid: 5,
    pid: 3,
    name: 'Medium Coke',
    aliases: ['Coke', 'Coca Cola', 'Regular Coke'],
    key: 'e',
    quantity: 1,
    children: [],
};

export const coke6: ItemInstance = {
    uid: 6,
    pid: 3,
    name: 'Medium Coke',
    aliases: ['Coke', 'Coca Cola', 'Regular Coke'],
    key: 'e',
    quantity: 1,
    children: [],
};

export const tomato3: ItemInstance = {
    uid: 3,
    pid: 4,
    name: 'Tomato',
    aliases: ['Roma Tomato'],
    key: 'g',
    quantity: 1,
    children: [],
};

export const hamburger4Bread0Lettuce3: ItemInstance = {
    uid: 4,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'h',
    quantity: 1,
    children: [bread0, lettuce3],
};

export const hamburger4Bread0: ItemInstance = {
    uid: 4,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'h',
    quantity: 1,
    children: [bread0],
};

export const hamburger4Bread0Tomato3: ItemInstance = {
    uid: 4,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'h',
    quantity: 1,
    children: [bread0, tomato3],
};

export const hamburger5Bread1: ItemInstance = {
    uid: 5,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'k',
    quantity: 1,
    children: [bread1],
};

export const hamburger5Bread1Tomato3: ItemInstance = {
    uid: 5,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'k',
    quantity: 1,
    children: [bread1, tomato3],
};

export const testCart: Cart = {
    items: [hamburger4Bread0Lettuce3, hamburger5Bread1],
};

// export const attributeSet: Set<AID> = new Set<AID>([1,2,3,4,5]);
// Tensor would look like: "1:2:3"
// gpid:2:3 => spid
/**
 * One att per dimension
 * Dimensions have default atts
 *    e.g. grande for size
 *
 * Have gpid and set of att, get spid
 * gpid has a matrix/tensor with as many dims as it would like
 * Every "coord" will have a value, or spid.
 *
 * Worry about invalid coord later on, whenever it's obvious you need to..
 */

// const sizeSmall = 0;
// const sizeMedium = 1;
// const sizeLarge = 2;
// const sizes: AttributeItem[] = [
//     {
//         pid: sizeSmall,
//         name: 'small',
//         aliases: ['small']
//     },
//     {
//         pid: sizeMedium,
//         name: 'medium',
//         aliases: ['medium'],
//         isDefault: true
//     },
//     {
//         pid: sizeLarge,
//         name: 'large',
//         aliases: ['large']
//     },
// ];

// const cheeseSauce = 3;
// const noCheese = 4;
// const cheeses: AttributeItem[] = [
//     {
//         pid: cheeseSauce,
//         name: 'cheese sauce',
//         aliases: ['cheese sauce'],
//         isDefault: true
//     },
//     {
//         pid: noCheese,
//         name: 'no cheese',
//         aliases: ['no cheese']
//     }
// ];

// const size: PID = 0;
// const cheese: PID = 1;
// const sizeDimension = new Dimension(size, sizes.values());
// const cheeseDimension = new Dimension(cheese, cheeses.values());
// const cheeseFriesDimensions = [
//     sizeDimension,
//     cheeseDimension
// ];

// const smallFriesCheeseSauceAttr: Set<AID> = new Set([
//     sizeDimension.attributes[0].pid,
//     cheeseDimension.defaultAttribute
// ])

// const anyMatrixId: PID = 123;
// const smallFriesCheeseSauceMatrix: Matrix = new Matrix(anyMatrixId,
//     cheeseFriesDimensions);
