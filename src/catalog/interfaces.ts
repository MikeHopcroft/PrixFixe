/**
 * Category ID. A type alias to keep various concepts delineated.
 */
export type CID = number;

/**
 * Tensor ID. A type alias to keep various concepts delineated.
 */
export type TID = number;

/**
 * Product ID.  A type alias to keep various concepts delineated. Each generic
 * product such as `milkshakes` or `coffees` will have its own unique PID.
 */
export type PID = number;

/**
 * Stock Keeping Unit. A type alias to keep various concepts delineated. Each
 * specific product such as `small strawberry` `milkshake` or `large decaf iced
 * coffee` will have its own unique SKU.
 */
export type SKU = number;

/**
 * A type alias to keep various concepts delineated.
 *
 * Each specific product such as `small strawberry milkshake` or `large decaf`
 * `iced coffee` will have its own unique Key. The Key is a tensor where the
 * first dimesnion is a generic product's PID, and any other dimensions
 * determine which attributes are added.
 *
 * @example '6122757:0:4'
 */
export type Key = string;

/**
 * A catch-all type.
 */
export interface Entity {
    name: string;
}

/**
 * A generic product is a top-level item that can be combined with a set of
 * attributes to form a specific product. For example, a `latte` is a generic
 * product that must be configured with a size and iced vs hot to produce a
 * specific product like a `small iced latte`.
 */
export interface GenericEntity extends Entity {
    pid: PID;
    cid: CID; // While knowing a menu item's category may not help us,
    // it would be nice to have all entities have the same
    aliases: string[];
    tensor: TID;
    defaultKey: Key;
}

/**
 * The interface for specific products like `large chocolate milkshake no`
 * `whipped cream` or `small coffee`.
 */
export interface SpecificEntity extends Entity {
    sku: SKU;
    key: Key;
}

/**
 * TypedEntity provides polymorphic behavior for both Generic and Specific
 * entities. The intention here is for it to be used similar to a mixin.
 */
export type TypedEntity = MenuItem | Option;
export type GenericTypedEntity = TypedEntity & GenericEntity;
export type SpecificTypedEntity = TypedEntity & SpecificEntity;

///////////////////////////////////////////////////////////////////////////////
// Symbols to be used for type annotations, allowing for polymorphic behavior
//   within the class of specific or generic items
///////////////////////////////////////////////////////////////////////////////
export const MENUITEM: unique symbol = Symbol('MENUITEM');
export type MENUITEM = typeof MENUITEM;

export const OPTION: unique symbol = Symbol('OPTION');
export type OPTION = typeof OPTION;

///////////////////////////////////////////////////////////////////////////////
// MenuItem
///////////////////////////////////////////////////////////////////////////////
/**
 * Menu item includes food, drink, or any "top-level" item which acts as a
 * parent to other items (such as options).
 */
export interface MenuItem extends Entity {
    kind: MENUITEM;
}

///////////////////////////////////////////////////////////////////////////////
// Option
///////////////////////////////////////////////////////////////////////////////
/**
 * Options are items which attach to MenuItems and child items in the cart. An
 * example of an Option would be a sauce or a drizzle.
 */
export interface Option extends Entity {
    kind: OPTION;
}

///////////////////////////////////////////////////////////////////////////////
// Entitiy Factories
//
// AJV will act as a schema validator for the storage of various types, and we
//   will then add type discriminators based upon what file we are loading. In
//   other words, we will have `kind=OPTION` when loading `option.yaml`.
///////////////////////////////////////////////////////////////////////////////
export const genericEntityFactory = (entity: GenericEntity, kind: symbol) => {
    return entityTyper(entity, kind) as GenericTypedEntity;
};

export const specificEntityFactory = (entity: SpecificEntity, kind: symbol) => {
    return entityTyper(entity, kind) as SpecificTypedEntity;
};

export function entityTyper(entity: Entity, kind: symbol): TypedEntity {
    switch (kind) {
        case MENUITEM:
            return {
                ...entity,
                kind: MENUITEM,
            } as MenuItem;
        case OPTION:
            return {
                ...entity,
                kind: OPTION,
            } as Option;
        default:
            throw TypeError('Unknown Type sent to `entityTyper`');
    }
}

// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
export interface ICatalog {
    hasPID(pid: PID): boolean;

    getGeneric(pid: PID): GenericTypedEntity;

    getGenericForKey(key: Key): GenericTypedEntity;

    getGenericMap(): Map<PID, GenericTypedEntity>;

    genericEntities(): IterableIterator<GenericTypedEntity>;

    hasKey(key: Key): boolean;

    getSpecific(key: Key): SpecificTypedEntity;

    getSpecificsForGeneric(pid: PID): IterableIterator<Key>;

    specificEntities(): IterableIterator<SpecificTypedEntity>;
}
