import { ErrorObject } from "ajv";

/**
 * An interface for schema validation errors reported by AJV
 */
interface YAMLValidationError extends TypeError {
    ajvError?: ErrorObject[];
}

interface YAMLValidationErrorConstructor {
    new(message?: string, error?: ErrorObject[]): YAMLValidationError;
    (message?: string,  error?: ErrorObject[] | null): YAMLValidationError;
    readonly prototype: YAMLValidationError;
}

export declare var YAMLValidationError: YAMLValidationErrorConstructor;
