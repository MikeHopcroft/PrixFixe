import { IOutputError } from 'better-ajv-errors';

export class YAMLValidationError extends TypeError {
    constructor(message: string, ajvErrors: IOutputError[]) {
        super(message);
        this.name = 'YAML Validation Error';

        console.log(ajvErrors);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, YAMLValidationError.prototype);
    }
}
