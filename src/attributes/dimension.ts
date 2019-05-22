import { AID } from '../attributes';
import { PID } from '../catalog';

import { AttributeItem } from './interfaces';

// Represents a characteristic like size, color, or flavor. Each Dimension is
// associated with a number of attributes such as `small`, `medium` and
// `large`.
export class Dimension {
    readonly id: PID;
    readonly attributes: AttributeItem[];

    constructor(id: PID, attributesIterator: IterableIterator<AttributeItem>) {
        this.id = id;
        this.attributes = [...attributesIterator[Symbol.iterator]()];
        if (this.attributes.length < 1) {
            const message = `expect at least one attribute`;
            throw new TypeError(message);
        }
    }
}
