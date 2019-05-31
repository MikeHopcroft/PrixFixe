import {
    AID,
    AttributeItem,
    AttributeUtilities,
    Catalog,
    IDGenerator,
    ItemInstanceOld,
    KEY,
    PID,
} from '../';

import { AttributeInfo, Dimension } from '../';
///////////////////////////////////////////////////////////////////////////////
//
// AttributeUtils
//
// Convenience methods relating to the menu and legal ItemInstance
// configurations.
//
///////////////////////////////////////////////////////////////////////////////
export class AttributeUtils implements AttributeUtilities {
    private readonly attributeInfo: AttributeInfo;
    private readonly catalog: Catalog;
    private readonly idGenerator: IDGenerator;
    //
    // Operations involving Attributes.
    //

    constructor(
        catalog: Catalog,
        idGenerator: IDGenerator,
        attributeInfo: AttributeInfo
    ) {
        this.attributeInfo = attributeInfo;
        this.catalog = catalog;
        this.idGenerator = idGenerator;
    }

    // Returns the specific product id for a generic product, configured by a
    // set of attributes. Each generic product specifies a matrix with
    // configuration dimensions. Each coordinate in this matrix corresponds to
    // a specific product. Coordinates are specified by attribute ids. When
    // there is no attribute specified for a particular dimension, the menu's
    // default attribute id is used. Attributes associated with dimensions not
    // related to the generic product will be ignored.
    //
    // Use case: pass in the GPID for the generic 'latte' product along with
    // attributes like 'large' and 'iced' in order to get the SPID for the
    // specific product 'large iced latte'.
    // ISSUE: throw or return undefined?
    createItemInstance(
        pid: PID,
        attributeIDs: Set<AID>
    ): ItemInstanceOld | undefined {
        if (this.catalog.hasPID(pid)) {
            const parent = this.catalog.getGeneric(pid);

            const parentMatrix = this.attributeInfo.getMatrixForEntity(
                parent.pid
            );

            // The key starts as the PID, but will have AIDs appended to it.
            let itemKey: KEY = String(pid);

            // Append attribute names together to ultimately get the specific
            // product's name.
            let attributeNames = '';

            // An index holds the default values for attributes. E.g. [0,0,0]
            const defaultAttributeKeys = parent.defaultKey.split(':').splice(1);

            // Store any attributes converted to ItemInstances.
            const attributes: ItemInstanceOld[] = [];

            // Instead of looking at AIDs that have been passed in, we look at
            // the number of dimensions that the defaultKey has. Any dimension
            // that does not map to a passed attribute will default.
            for (const dimension of parentMatrix.dimensions) {
                const dimensionIndex = parentMatrix.dimensions.indexOf(
                    dimension
                );

                // Sets resAttribute if an AID has been passed in for the
                // particular dimension.
                let resAttribute: AttributeItem | undefined = this.getAttribute(
                    attributeIDs,
                    dimension
                );

                // If the previous call returned undefined, no attributes
                // belong to the current dimension. Instead, find the default
                // attribute.
                if (resAttribute === undefined) {
                    const defaultAttributeIndex = Number(
                        defaultAttributeKeys[dimensionIndex]
                    );

                    resAttribute = dimension.attributes[defaultAttributeIndex];
                }

                // Create an ItemInstance from the AttributeItem, then add it
                // to attributes.
                if (resAttribute !== undefined) {
                    const dimensionKey: KEY = dimensionIndex.toString();

                    const resAttributeItem: ItemInstanceOld = {
                        pid: resAttribute.aid,
                        name: resAttribute.name,
                        aliases: resAttribute.aliases,
                        uid: this.idGenerator.nextId(),
                        key: dimensionKey,
                        quantity: 1, // ISSUE: Default to 1 for now.
                        children: [],
                    };
                    attributeNames += resAttribute.name + ' ';
                    attributes.push(resAttributeItem);

                    // Assemble a key for a specific product.
                    itemKey += ':' + resAttributeItem.key;
                }
            }

            parent.name = attributeNames + parent.name;
            const newItem: ItemInstanceOld = {
                pid,
                name: parent.name,
                aliases: parent.aliases,
                uid: this.idGenerator.nextId(),
                key: itemKey,
                quantity: 1, // ISSUE: Default to 1 for now.
                children: attributes,
            };

            return newItem;
        }
        return undefined;
    }

    // TODO: This is a bit lazy right now. If there are multiple matching
    //       AIDs, then the first 0 through n attributes will be overwritten.
    //       In that case - what's the desired behavior?
    getAttribute(
        attributeIDs: Set<AID>,
        dimension: Dimension
    ): AttributeItem | undefined {
        let resAttribute: AttributeItem | undefined = undefined;

        for (const attribute of dimension.attributes) {
            // Check if the current dimension contains an attribute
            // with an AID that is also in the set of attributeIDs.
            if (attributeIDs.has(attribute.aid)) {
                resAttribute = attribute;
            }
        }
        // ISSUE: Do we want to throw or return undefined here?
        // throw new Error(`Attribute ID ${attributeID} is not in the catalog.`);
        return resAttribute;
    }
}
