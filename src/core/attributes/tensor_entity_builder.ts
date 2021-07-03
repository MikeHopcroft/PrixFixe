import { Key, PID } from '../catalog';

import { AttributeInfo } from './attribute_info';
import { DID } from './dimension';
import { AID } from './interfaces';

/**
 * TensorEntityBuilder collects Attribute and Entity values that will later be
 * used to generate an Entity key which can be used to lookup the specific PID.
 *
 * For example, we might have a `cone` which is configured by `flavor` and
 * `size` dimensions.
 *
 * Adding the entity `cone` and the attributes `small` and `chocolate` will
 * allow us to generate a key which yields the PID for a `small chocolate cone`.
 */
export class TensorEntityBuilder {
  private readonly info: AttributeInfo;

  private pid: PID | undefined = undefined;
  private readonly dimensionIdToAttribute = new Map<DID, AID>();

  constructor(info: AttributeInfo) {
    this.info = info;
  }

  hasPID(): boolean {
    return this.pid !== undefined;
  }

  setPID(pid: PID) {
    if (this.pid === undefined) {
      this.pid = pid;
      return true;
    } else {
      const message = `attempting to overwrite entity ${this.pid} with ${pid}`;
      throw TypeError(message);
    }
  }

  addAttribute(aid: AID): boolean {
    const coordinate = this.info.getAttributeCoordinates(aid);
    if (this.dimensionIdToAttribute.has(coordinate.dimension.did)) {
      return false;
    } else {
      this.dimensionIdToAttribute.set(coordinate.dimension.did, aid);
      return true;
    }
  }

  setAttribute(aid: AID) {
    const coordinate = this.info.getAttributeCoordinates(aid);
    this.dimensionIdToAttribute.set(coordinate.dimension.did, aid);
  }

  getKey(generateRegexKey: boolean): Key {
    if (this.pid === undefined) {
      throw TypeError('no pid set');
    }

    return this.info.getKey(
      this.pid,
      this.dimensionIdToAttribute,
      generateRegexKey
    );
  }

  /**
   * Iterator for PIDs of attributes that aren't associated with dimensions of
   * the entity's tensor. This includes all collected attributes in the cases
   * where the entity has not been set and where the entity is not associated
   * with a tensor.
   */
  *getUnusedAttributes(): IterableIterator<AID> {
    // If a PID is undefined, we want to return every attribute.
    if (this.pid === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [did, aid] of this.dimensionIdToAttribute.entries()) {
        yield aid;
      }
    } else {
      // If we've collected an entity, attempt to get its tensor.
      const tensor = this.info.getTensorForEntity(this.pid);
      for (const [did, aid] of this.dimensionIdToAttribute.entries()) {
        // Only yield attributes that are not associated with a
        // dimension.
        if (!AttributeInfo.hasDimension(tensor, did)) {
          yield aid;
        }
      }
    }
  }
}
