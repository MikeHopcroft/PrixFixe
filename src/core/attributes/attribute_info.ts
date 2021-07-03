import { Catalog, Key, TID, PID } from '../catalog';

import { DID, Dimension } from './dimension';

import {
  AID,
  AttributeDescription,
  DimensionAndTensorDescription,
} from './interfaces';

import { Tensor } from './tensor';

/**
 * The (dimension, position) coordinates of an attribute within a Tensor.
 * Dimension corresponds to a characteristic like `size`. Position corresponds
 * to a specific characteristic value such as `small`, `medium`, or `large`.
 */
export interface AttributeCoordinate {
  dimension: Dimension;
  position: number;
}

/**
 * Store information about the relationships between DimensionAndTensorDescription, Dimensions,
 * and Tensors.
 */
export class AttributeInfo {
  private readonly catalog: Catalog;
  private readonly nameToDimension = new Map<string, Dimension>();
  private readonly didToDimension = new Map<DID, Dimension>();
  private readonly aidToCoordinate = new Map<AID, AttributeCoordinate>();
  private readonly tensorIdToTensor = new Map<TID, Tensor>();
  private readonly aidToDescription = new Map<AID, AttributeDescription>();

  constructor(catalog: Catalog, attributes: DimensionAndTensorDescription) {
    this.catalog = catalog;

    for (const dimension of attributes.dimensions) {
      for (const attribute of dimension.attributes) {
        if (this.aidToDescription.has(attribute.aid)) {
          const message = `Duplicate aid ${attribute.aid} on "${attribute.name}"`;
          throw new TypeError(message);
        }
        this.aidToDescription.set(attribute.aid, attribute);
      }

      this.addDimension(
        new Dimension(
          dimension.did,
          dimension.name,
          dimension.attributes.values()
        )
      );
    }

    for (const tensor of attributes.tensors) {
      const dimensions: Dimension[] = [];
      for (const did of tensor.dimensions) {
        const dimension = this.didToDimension.get(did);
        if (!dimension) {
          const message = `unknown dimension id ${did}.`;
          throw TypeError(message);
        }
        dimensions.push(dimension);
      }
      this.addTensor({ tid: tensor.tid, dimensions });
    }
  }

  /**
   * Indexes a Dimension and its Attributes.
   */
  private addDimension(dimension: Dimension) {
    if (this.didToDimension.has(dimension.did)) {
      const message = `found duplicate dimension id ${dimension.did}.`;
      throw new TypeError(message);
    }
    this.didToDimension.set(dimension.did, dimension);

    if (this.nameToDimension.has(dimension.name)) {
      const message = `found duplicate dimension name "${dimension.name}".`;
      throw new TypeError(message);
    }
    this.nameToDimension.set(dimension.name, dimension);

    let position = 0;
    for (const attribute of dimension.attributes) {
      if (this.aidToCoordinate.has(attribute.aid)) {
        const message = `found duplicate attribute pid ${attribute.aid}.`;
        throw new TypeError(message);
      }
      this.aidToCoordinate.set(attribute.aid, {
        dimension,
        position,
      });

      position++;
    }
  }

  getDimension(did: DID): Dimension {
    const dimension = this.didToDimension.get(did);
    if (dimension === undefined) {
      const message = `Unknown dimension id ${did}.`;
      throw TypeError(message);
    }
    return dimension;
  }

  getDimensionFromName(name: string): Dimension {
    const dimension = this.nameToDimension.get(name);
    if (dimension === undefined) {
      const message = `Unknown dimension name "${name}".`;
      throw TypeError(message);
    }
    return dimension;
  }

  dimensions() {
    return this.nameToDimension.values();
  }

  getAttribute(aid: AID): AttributeDescription {
    const attribute = this.aidToDescription.get(aid);
    if (attribute === undefined) {
      const message = `Unknown attribute id ${aid}.`;
      throw TypeError(message);
    }
    return attribute;
  }

  /**
   * Indexes a Tensor.
   */
  private addTensor(tensor: Tensor) {
    if (this.tensorIdToTensor.has(tensor.tid)) {
      const message = `found duplicate tensor id ${tensor.tid}.`;
      throw new TypeError(message);
    }
    this.tensorIdToTensor.set(tensor.tid, tensor);
  }

  /**
   * Look up an AttributeCoordinate by AID. The Coordinate provides the
   * Attribute's Dimension (e.g. `size`) and its Position in the Dimension
   * (e.g. `0 ==> small`).
   */
  getAttributeCoordinates(aid: AID): AttributeCoordinate {
    const coordinate = this.aidToCoordinate.get(aid);
    if (coordinate === undefined) {
      const message = `Unknown attribute id ${aid}.`;
      throw TypeError(message);
    }
    return coordinate;
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  // Tensor-related methods
  //
  ///////////////////////////////////////////////////////////////////////////

  getTensor(tid: TID) {
    const tensor = this.tensorIdToTensor.get(tid);
    if (tensor === undefined) {
      const message = `Bad tensor id ${tid}.`;
      throw message;
    }
    return tensor;
  }

  /**
   * Returns a GenericEntity's Tensor.
   */
  getTensorForEntity(pid: PID): Tensor {
    const genericEntity = this.catalog.getGeneric(pid);
    return this.getTensor(genericEntity.tensor);
  }

  /**
   * Given a GenericEntity's PID and a map from DID to AID, return a number
   * that represents those set of attribute values associated with Dimensions
   * of the GenericEntity's Tensor.
   *
   * @param {PID} pid A GenericEntity product id.
   * @param dimensionIdToAttribute Attribute ids, indexed by their
   * dimensions.
   * @param generateRegexKey If true, generate regex fragment `"\d+"` instead of default
   * coordinate.
   */
  getKey(
    pid: PID,
    dimensionIdToAttribute: Map<DID, AID>,
    generateRegexKey: boolean
  ): string {
    // Get the genericEntity for its tensor and defaultKey.
    const genericEntity = this.catalog.getGeneric(pid);
    const tensor = this.getTensor(genericEntity.tensor);

    // Convert the default key into a sequence of coordinate fields.
    const key = genericEntity.defaultKey;
    const fields = key.split(':'); //.map(parseBase10Int);
    fields.shift();

    if (generateRegexKey) {
      for (let i = 0; i < fields.length; ++i) {
        fields[i] = '\\d+';
      }
    }

    // Overwrite default coordinate fields with values supplied from the
    // map.
    for (const [index, dimension] of tensor.dimensions.entries()) {
      const aid = dimensionIdToAttribute.get(dimension.did);
      if (aid !== undefined) {
        const coordinate = this.getAttributeCoordinates(aid);
        fields[index] = coordinate.position.toString();
      }
    }

    // Build and return the key string.
    return [pid.toString(), ...fields].join(':');
  }

  getAttributes(key: Key): AID[] {
    const fields = key.split(':').map(parseBase10Int);
    const pid = fields[0];
    const tensor = this.getTensorForEntity(pid);

    fields.shift();
    const aids: AID[] = [];
    for (let i = 0; i < fields.length; ++i) {
      const dimension = tensor.dimensions[i];
      const attribute = dimension.attributes[fields[i]];
      aids.push(attribute.aid);
    }

    return aids;
  }

  static hasDimension(tensor: Tensor, did: DID): boolean {
    for (const dimension of tensor.dimensions) {
      if (dimension.did === did) {
        return true;
      }
    }
    return false;
  }

  static pidFromKey(key: Key): PID {
    const pid = Number.parseInt(key, 10);
    if (isNaN(pid)) {
      throw TypeError(`Bad key "${key}""`);
    }

    return pid;
  }
}

function parseBase10Int(text: string): number {
  const n = Number.parseInt(text, 10);
  if (isNaN(n)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const message = `Invalid number ${text}.`;
  }
  return n;
}
