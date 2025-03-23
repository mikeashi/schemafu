import { Command } from 'commander'
import { displayOperationDetails, runOperation } from '../utils/cli-utils.js';
import { resolvePath } from '../utils/file-utils.js';
import { validateSchema } from '../validator.js';


export async function validateAction(input: string, options: { strict: boolean }) {
    const inputPath = resolvePath(input);
    const result = await runOperation('Validating schema', async () => {
        const result = await validateSchema(inputPath, { strict: options.strict });
        if (!result.valid) {
            // Use a custom error to propagate validation errors
            const error: any = new Error('Schema validation failed');
            error.validationErrors = result.errors;
            throw error;
        }
        return result;
    });

    displayOperationDetails(result);
}


export function register(program: Command) {
    program
        .command('validate')
        .description('Validate a JSON schema against meta-schema')
        .argument('<input>', 'Input schema file path')
        .option('-s, --strict', 'Use strict validation mode', false)
        .action(validateAction)
}
