import { IOutputError } from 'better-ajv-errors';
import ajv = require('ajv');

export class YAMLValidationError extends TypeError {
    constructor(message: string, ajvErrors: IOutputError[]) {
        super(message);

        // WARNING: changing this name is a breaking API change,
        // since other code (including external code) by depend
        // on the name.
        this.name = 'YAML Validation Error';

        // TODO: this constructor should not be printing out error details.
        // This is the job of the error handler.
        // The constructor should store ajvErrors.
        console.log('YAML validation error:');
        const text = ajvErrors.toString();
        const caret = text.indexOf('^');
        console.log(text.slice(0, caret + 2));

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, YAMLValidationError.prototype);
    }
}
