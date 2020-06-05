import { assert } from 'chai';
import 'mocha';

import * as yaml from 'js-yaml';

import {
  DimensionAndTensorDescription,
  attributesFromYamlString,
} from '../../src/attributes';

const attributes: DimensionAndTensorDescription = {
  dimensions: [
    {
      did: 1,
      name: 'size',
      attributes: [
        {
          aid: 1,
          name: 'small',
          aliases: ['small'],
        },
        {
          aid: 2,
          name: 'medium',
          aliases: ['medium'],
        },
        {
          aid: 3,
          name: 'large',
          aliases: ['large'],
        },
      ],
    },
    {
      did: 2,
      name: 'flavor',
      attributes: [
        {
          aid: 4,
          name: 'vanilla',
          aliases: ['vanilla'],
        },
        {
          aid: 5,
          name: 'chocolate',
          aliases: ['chocolate'],
        },
        {
          aid: 6,
          name: 'strawberry',
          aliases: ['strawberry'],
        },
      ],
    },
  ],
  tensors: [
    {
      tid: 1,
      name: 'cones',
      dimensions: [1, 2],
    },
  ],
};

describe('AttributesYaml', () => {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //  itemsFromAttributes
  //
  ///////////////////////////////////////////////////////////////////////////////
  it('itemsFromAttributes', () => {
    const yamlText = yaml.dump(attributes);
    const observed = attributesFromYamlString(yamlText);
    assert.deepEqual(observed, attributes);
  });
});
