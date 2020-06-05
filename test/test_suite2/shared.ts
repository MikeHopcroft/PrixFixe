import { LogicalCart, LogicalItem } from '../../src/test_suite2';

export const option1a: LogicalItem = {
  quantity: 1,
  name: 'option1a',
  sku: '1000',
  children: [],
};

// Differs from option1a in quantity
export const option1b: LogicalItem = {
  quantity: 2,
  name: 'option1b',
  sku: '1000',
  children: [],
};

// Differs from option1a in sku
export const option1c: LogicalItem = {
  quantity: 1,
  name: 'option1c',
  sku: '1001',
  children: [],
};

// Differs from option1a in sku
export const option2a: LogicalItem = {
  quantity: 1,
  name: 'option2a',
  sku: '2000',
  children: [],
};

// Differs from option1a in sku
export const option3a: LogicalItem = {
  quantity: 1,
  name: 'option3a',
  sku: '3000',
  children: [],
};

export const product1a: LogicalItem = {
  quantity: 1,
  name: 'product1a',
  sku: '1',
  children: [option1a, option2a, option3a],
};

// Differs from 1a in children order
export const product1b: LogicalItem = {
  quantity: 1,
  name: 'product1b',
  sku: '1',
  children: [option3a, option2a, option1a],
};

// Differs from 1a in quantity
export const product1c: LogicalItem = {
  quantity: 2,
  name: 'product1c',
  sku: '1',
  children: [option1a, option2a, option3a],
};

// Differs from 1a in sku
export const product1d: LogicalItem = {
  quantity: 1,
  name: 'product1d',
  sku: '2',
  children: [option1a, option2a, option3a],
};

// Differs from 1a in children set
export const product1e: LogicalItem = {
  quantity: 1,
  name: 'product1e',
  sku: '1',
  children: [option1a, option2a],
};

// Differs from 1a in first option quantity
export const product1f: LogicalItem = {
  quantity: 1,
  name: 'product1f',
  sku: '1',
  children: [option1b, option2a, option3a],
};

// Differs from 1a in first option sku
export const product1g: LogicalItem = {
  quantity: 1,
  name: 'product1f',
  sku: '1',
  children: [option1c, option2a, option3a],
};

export const product2a: LogicalItem = {
  quantity: 1,
  name: 'product2a',
  sku: '2',
  children: [option1a, option2a],
};

export const product3a: LogicalItem = {
  quantity: 1,
  name: 'product3a',
  sku: '3',
  children: [option2a, option3a],
};

export const cart1: LogicalCart = { items: [product1a, product2a, product3a] };
