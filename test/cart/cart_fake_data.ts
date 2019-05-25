import { CartOld, ItemInstanceOld } from '../../src/cart/interfaces';

export const bread0: ItemInstanceOld = {
    uid: 0,
    pid: 0,
    name: 'Hamburger Bun',
    aliases: ['Bun', 'Bread'],
    key: 'a',
    quantity: 1,
    children: [],
};

export const bread1: ItemInstanceOld = {
    uid: 1,
    pid: 0,
    name: 'Hamburger Bun',
    aliases: ['Bun', 'Bread'],
    key: 'a',
    quantity: 1,
    children: [],
};

export const lettuce2: ItemInstanceOld = {
    uid: 2,
    pid: 1,
    name: 'Lettuce',
    aliases: ['Iceberg'],
    key: 'c',
    quantity: 1,
    children: [],
};

export const lettuce3: ItemInstanceOld = {
    uid: 3,
    pid: 1,
    name: 'Lettuce',
    aliases: ['Iceberg'],
    key: 'c',
    quantity: 2,
    children: [],
};

export const coke5: ItemInstanceOld = {
    uid: 5,
    pid: 3,
    name: 'Medium Coke',
    aliases: ['Coke', 'Coca Cola', 'Regular Coke'],
    key: 'e',
    quantity: 1,
    children: [],
};

export const coke6: ItemInstanceOld = {
    uid: 6,
    pid: 3,
    name: 'Medium Coke',
    aliases: ['Coke', 'Coca Cola', 'Regular Coke'],
    key: 'e',
    quantity: 1,
    children: [],
};

export const tomato3: ItemInstanceOld = {
    uid: 3,
    pid: 4,
    name: 'Tomato',
    aliases: ['Roma Tomato'],
    key: 'g',
    quantity: 1,
    children: [],
};

export const hamburger4Bread0Lettuce3: ItemInstanceOld = {
    uid: 4,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'h',
    quantity: 1,
    children: [bread0, lettuce3],
};

export const hamburger4Bread0: ItemInstanceOld = {
    uid: 4,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'h',
    quantity: 1,
    children: [bread0],
};

export const hamburger4Bread0Tomato3: ItemInstanceOld = {
    uid: 4,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'h',
    quantity: 1,
    children: [bread0, tomato3],
};

export const hamburger5Bread1: ItemInstanceOld = {
    uid: 5,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'k',
    quantity: 1,
    children: [bread1],
};

export const hamburger5Bread1Tomato3: ItemInstanceOld = {
    uid: 5,
    pid: 2,
    name: 'Hamburger',
    aliases: ['Burger', 'Sandwich'],
    key: 'k',
    quantity: 1,
    children: [bread1, tomato3],
};

export const testCart: CartOld = {
    items: [hamburger4Bread0Lettuce3, hamburger5Bread1],
};
