import { Cart, ItemInstance, AID } from '../../src/cart/interfaces';

export const bread0: ItemInstance = {
    uid: 0,
    pid: 0,
    name: 'Hamburger Bun',
    aliases: [
        'Bun',
        'Bread'
    ],
    key: 'a',
    quantity: 1,
    children: []
}

export const bread1: ItemInstance = {
    uid: 1,
    pid: 0,
    name: 'Hamburger Bun',
    aliases: [
        'Bun',
        'Bread'
    ],
    key: 'b',
    quantity: 1,
    children: []
}

export const lettuce2: ItemInstance = {
    uid: 2,
    pid: 1,
    name: 'Lettuce',
    aliases: [
        'Iceberg'
    ],
    key: 'c',
    quantity: 1,
    children: []
}

export const lettuce3: ItemInstance = {
    uid: 3,
    pid: 1,
    name: 'Lettuce',
    aliases: [
        'Iceberg'
    ],
    key: 'd',
    quantity: 2,
    children: []
}

export const hamburger4Bread0Lettuce3: ItemInstance = {
    uid: 4,
    pid: 2,
    name: 'Hamburger',
    aliases: [
        'Burger',
        'Sandwich'
    ],
    key: 'e',
    quantity: 1,
    children: [
        bread0,
        lettuce3
    ]
}

export const dupHamburger1Bread0Lettuce3: ItemInstance = {
    uid: 7,
    pid: 2,
    name: 'Hamburger',
    aliases: [
        'Burger',
        'Sandwich'
    ],
    key: 'h',
    quantity: 1,
    children: [
        bread0,
        lettuce3
    ]
}

export const hamburger5Bread1: ItemInstance = {
    uid: 5,
    pid: 2,
    name: 'Hamburger',
    aliases: [
        'Burger',
        'Sandwich'
    ],
    key: 'f',
    quantity: 1,
    children: [
        bread1
    ]
}

export const coke6: ItemInstance = {
    uid: 6,
    pid: 3,
    name: 'Medium Coke',
    aliases: [
        'Coke',
        'Coca Cola',
        'Regular Coke'
    ],
    key: 'g',
    quantity: 1,
    children: []
}

export const coke5: ItemInstance = {
    uid: 5,
    pid: 3,
    name: 'Medium Coke',
    aliases: [
        'Coke',
        'Coca Cola',
        'Regular Coke'
    ],
    key: 'g',
    quantity: 1,
    children: []
}

export const lettuce8: ItemInstance = {
    uid: 8,
    pid: 1,
    name: 'Lettuce',
    aliases: [
        'Iceberg'
    ],
    key: 'i',
    quantity: 1,
    children: []
}

export const tomato2: ItemInstance = {
    uid: 2,
    pid: 4,
    name: 'Tomato',
    aliases: [
        'Roma Tomato'
    ],
    key: 'j',
    quantity: 1,
    children: []
}

export const tomato9: ItemInstance = {
    uid: 9,
    pid: 4,
    name: 'Tomato',
    aliases: [
        'Roma Tomato'
    ],
    key: 'k',
    quantity: 1,
    children: []
}

export const testCart: Cart = {
    items: [
        hamburger4Bread0Lettuce3,
        hamburger5Bread1
    ]
}

export const attributeSet: Set<AID> = new Set<AID>([1,2,3,4,5]);
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