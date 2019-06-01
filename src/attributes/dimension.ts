import { AttributeItem } from '../';

export type DID = number;

/**
 * Represents a characteristic like size, color, or flavor. Each
 * Dimension is associated with a number of attributes such as `small` `medium`
 * and `large`.
 */
export class Dimension {
    readonly did: DID;
    readonly name: string;
    readonly attributes: AttributeItem[];

    constructor(
        did: DID,
        name: string,
        attributesIterator: IterableIterator<AttributeItem>
    ) {
        this.did = did;
        this.name = name;
        this.attributes = [...attributesIterator[Symbol.iterator]()];
        if (this.attributes.length < 1) {
            const message = `expect at least one attribute`;
            throw new TypeError(message);
        }
    }
}
