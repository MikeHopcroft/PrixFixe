import { Cart, ItemInstance } from './interfaces';

const bread1: ItemInstance = {
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

const bread2: ItemInstance = {
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

const lettuce1: ItemInstance = {
    pid: 1,
    name: 'Lettuce',
    aliases: [
        'Iceberg'
    ],
    key: 'c',
    quantity: 1,
    children: []
}

const lettuce2: ItemInstance = {
    pid: 1,
    name: 'Lettuce',
    aliases: [
        'Iceberg'
    ],
    key: 'd',
    quantity: 2,
    children: []
}

export const hamburger1: ItemInstance = {
    pid: 2,
    name: 'Hamburger',
    aliases: [
        'Burger',
        'Sandwich'
    ],
    key: 'e',
    quantity: 1,
    children: [
        bread1,
        lettuce1
    ]
}

const hamburger2: ItemInstance = {
    pid: 2,
    name: 'Hamburger',
    aliases: [
        'Burger',
        'Sandwich'
    ],
    key: 'f',
    quantity: 1,
    children: [
        bread2
    ]
}

export const testOption: ItemInstance = {
    pid: 1,
    name: 'Lettuce',
    aliases: [
        'Iceberg'
    ],
    key: 'd',
    quantity: 2,
    children: []
}

export const testCart: Cart = {
    items: [
        hamburger1,
        hamburger2
    ]
}