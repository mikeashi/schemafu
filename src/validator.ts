import {Ajv, ErrorObject } from 'ajv';
import { readJsonFile } from './utils/file-utils.js';

export interface ValidationOptions {
    /** Whether to use strict validation mode */
    strict?: boolean;
}

export interface ValidationResult {
    /** Whether the validation was successful */
    valid: boolean;
    /** Validation errors, if any */
    errors: ErrorObject[] | null;
}

/**
 * Validates a JSON schema against the appropriate meta-schema
 * 
 * @param schemaPath - Path to the schema file to validate
 * @param options - Validation options
 * @returns Validation result with errors if invalid
 */
export async function validateSchema(
    schemaPath: string,
    options: ValidationOptions = {}
): Promise<ValidationResult> {
    try {
        // Read and parse the schema file
        const schema = await readJsonFile(schemaPath);

        // Configure Ajv instance
        const ajv = new Ajv({
            strict: options.strict ?? false,
            allErrors: true
        });

        try {
            // Attempt to compile the schema, which validates it against meta-schema
            const validate = ajv.compile(schema);
            return { valid: true, errors: null };
        } catch (error: any) {
            // Compilation failed, return validation errors
            return {
                valid: false,
                errors: error.errors || [{ message: error.message }]
            };
        }
    } catch (error: any) {
        // Failed to read or parse the schema file
        throw new Error(`Failed to validate schema: ${error.message}`);
    }
}