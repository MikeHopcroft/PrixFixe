///////////////////////////////////////////////////////////////////////////////
// Type aliases to keep various concepts delineated.
///////////////////////////////////////////////////////////////////////////////
export type PID = number;
export type CID = number;
export type SKU = number;

export type MatrixID = number;
export type KEY = string;

///////////////////////////////////////////////////////////////////////////////
// Catch-all type
///////////////////////////////////////////////////////////////////////////////
export interface Entity {
    name: string;
}

///////////////////////////////////////////////////////////////////////////////
export interface GenericEntity extends Entity {
    pid: PID;
    cid: CID; // While knowing a menu item's catagory may not help us,
    // it would be nice to have all entities have the same
    aliases: string[];
    matrix: MatrixID;
    defaultKey: KEY;
}

export interface SpecificEntity extends Entity {
    sku: SKU;
    key: KEY;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// TypedEntity provides polymorphic behavior for both Generic and Specific
//   entities. The intention here is for it to be used similar to a mixin.
///////////////////////////////////////////////////////////////////////////////
export type TypedEntity = MenuItem | Option | Modifier;
export type GenericTypedEntity = TypedEntity & GenericEntity;
export type SpecificTypedEntity = TypedEntity & SpecificEntity;

///////////////////////////////////////////////////////////////////////////////
// Symbols to be used for type annotations, allowing for polymorphic behavior
//   within the class of specific or generic items
///////////////////////////////////////////////////////////////////////////////
export const MENUITEM: unique symbol = Symbol('MENUITEM');
export type MENUITEM = typeof MENUITEM;

export const MODIFIER: unique symbol = Symbol('MODIFIER');
export type MODIFIER = typeof MODIFIER;

export const OPTION: unique symbol = Symbol('OPTION');
export type OPTION = typeof OPTION;

///////////////////////////////////////////////////////////////////////////////
// MenuItem
//
// Menu item includes food, drink, or any "top-level" item which acts as a
//   parent to other items (such as options).
///////////////////////////////////////////////////////////////////////////////
export interface MenuItem extends Entity {
    kind: MENUITEM;
}

///////////////////////////////////////////////////////////////////////////////
// Option
//
// Options are items which attech to MenuItems and child items in the cart.
//   An example of an Option would be a sauce or a drizzle.
///////////////////////////////////////////////////////////////////////////////
export interface Option extends Entity {
    kind: OPTION;
}

///////////////////////////////////////////////////////////////////////////////
// Modifiers
//
// Modifiers are options who are mutally exclusive within their category.
//   e.g., 2% Milk as a base for a Latte vs Whole Milk.
///////////////////////////////////////////////////////////////////////////////
export interface Modifier extends Entity {
    kind: MODIFIER;
}

///////////////////////////////////////////////////////////////////////////////
// Entitiy Factories
//
// AJV will act as a schema validator for the storage of various types, and
//   we will then add type discriminators based upon what file we are loading.
//   In other words, we will have `kind=OPTION` when loading `option.yaml`.
///////////////////////////////////////////////////////////////////////////////

export const genericEntityFactory = (entity: GenericEntity, kind: symbol) => {
    return entityTyper(entity, kind) as GenericTypedEntity;
};

export const specificEntityFactory = (entity: SpecificEntity, kind: symbol) => {
    return entityTyper(entity, kind) as SpecificTypedEntity;
};

// TODO: is there a AJV factory for types?
// TODO: template T<kind>?
export function entityTyper(entity: Entity, kind: symbol): TypedEntity {
    switch (kind) {
        case MENUITEM:
            return {
                ...entity,
                kind: MENUITEM,
            } as MenuItem;
        case MODIFIER:
            return {
                ...entity,
                kind: MODIFIER,
            } as Modifier;
        case OPTION:
            return {
                ...entity,
                kind: OPTION,
            } as Option;
        default:  // TODO: never type gaurd
            throw TypeError('Unknown Type sent to `entityTyper`');
    }
}
