import {
    AttributeInfo,
    Dimension,
    Tensor
} from '../attributes';

/*

Ability to write out menu files
  Not sure we want to keep the rules file format

Ability to generate World from authoring files / world files.

io-ts types for YAML verification

Create DimensionAndTensorDescription
  Null tensor: "none"
    Investigate keys for null tensor
  Validate type
  Verify unique attribute names per dimension
  Verify unique dimension names
  Verify unique tensor names
  Verify legal names (e.g. alpha-numeric, no special characters, no reserved words)
  Assign DIDs, AIDs, TIDs

AttributeInfo constructor
    nameToTensor map and function
    (tensor, dimension index, attribute_name) => position

enumerate forms: wildcard or named attribute

for each group
  expand forms
  for each item
    apply template
    expand specifics
      some solution for overriding generated specifics with hand-authored
      e.g. to supply custom/non-generated SKU, custom/non-generated name
    update tagToSpecifics

build rules
  legal child
  mutual exclusion
*/


// export type SpecificEntity = t.TypeOf<typeof specificEntityType>;


// export interface SpecificEntity {
//     // name: string;
//     // key: Key;
//     form: formType
//     sku: SKU;
// }

// export type Key = string;
// type PID = number;
// export type SKU = string;

// type Form = string[];

// interface ExcludeForm {
//     exclude: Form;
// }

// interface IncludeForm {
//     include: Form;
// }

// interface GenericSpec {
//     tags: string[];
//     tensor: string;
//     default: Form;
//     name: string;
//     aliases: string[];
// }

// interface Generic extends GenericSpec {
//     pid: PID;
// }

// interface Specific {
//     form: Form,
//     sku: SKU,
//     key: Key,
// }

// interface Group {
//     forms: Array<IncludeForm | ExcludeForm>;
//     template: Partial<GenericSpec>;
//     items: Array<Partial<GenericSpec>>;
// }

// class IdGenerator {
//     current = 1;
//     rounding = 100;

//     nextId() {
//         return this.current++;
//     }

//     nextBatch() {
//         this.current = (Math.floor(this.current / this.rounding) + 1) * this.rounding;
//     }
// }

// function getTensor(name: string): Tensor {
//     throw new TypeError('Not implemented');
// }

// function expand1(group: Group, ids: IdGenerator): Array<Partial<GenericSpec>> {
//     // Apply template fields and PIDs to items.
//     ids.nextBatch();
//     const i1 = group.items.map( item => ({...group.template, ...item, pid: ids.nextId()}));

//     // Schema validate items
// }

// function* generateForms(
//     tensor: Tensor,
//     ops: Array<IncludeForm | ExcludeForm>
// ): IterableIterator<Form> {
//     throw new TypeError('Not implemented');
//     tensor.dimensions[0].attributes[0].
// }

// function expand2(group: Group, items: Generic[]): Specific[] {
//     for (const item of items) {
//     }
// }

// function* generateSpecifics(item: Generic): Specific {
//     // Verify tensor exists
//     const tensor = getTensor(item.tensor);
    
//     // Verify that forms have the correct rank
//     for (const form of item.forms)
//     // Generate forms, by processing sequence of includes and excludes

// }