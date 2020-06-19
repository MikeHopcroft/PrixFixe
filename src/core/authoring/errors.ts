///////////////////////////////////////////////////////////////////////////////
//
// Errors
//
///////////////////////////////////////////////////////////////////////////////
// export class EntityNotFoundError extends Error {
//     constructor(message: string) {
//         super(message);
//     }
// }

// export class IllegalOperationError extends Error {
//     constructor(message: string) {
//         super(message);
//     }
// }
export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}
