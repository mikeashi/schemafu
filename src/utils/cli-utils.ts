import chalk from 'chalk';
import ora from 'ora';
import { ErrorObject } from 'ajv';
import { formatValidationErrors, formatFilePath, formatDuration } from './format-utils.js';


// Interface for operation results
interface OperationResult<T = any> {
    success: boolean;
    message: string;
    duration: number;
    data?: T;
    error?: Error;
}

// Define interface for validation errors
interface ValidationError extends Error {
    validationErrors: ErrorObject[] | null;
}


/**
 * Runs an operation with spinner and timing
 * @param operationName Name of the operation for display
 * @param operation Async function to execute
 * @returns Operation result
 */
export async function runOperation<T>(
    operationName: string,
    operation: () => Promise<T>
): Promise<OperationResult<T>> {
    const spinner = ora(`${operationName}...`).start();
    const startTime = Date.now();

    try {
        const result = await operation();
        const duration = Date.now() - startTime;
        spinner.succeed(`${operationName} completed in ${formatDuration(duration)}`);

        return {
            success: true,
            message: `${operationName} completed successfully`,
            duration,
            data: result
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        spinner.fail(`${operationName} failed`);

        return {
            success: false,
            message: error.message,
            duration,
            error
        };
    }
}

/**
 * Type guard to check if an error contains validation errors
 */
function isValidationError(error: any): error is ValidationError {
    return error && 'validationErrors' in error &&
        (Array.isArray(error.validationErrors) || error.validationErrors === null);
}



/**
 * Displays operation result details
 */
export function displayOperationDetails(result: OperationResult) {
    if (!result.success) {
        console.error(chalk.red(result.message));

        // Display validation errors if available
        if (result.error && isValidationError(result.error)) {
            console.log(`\n${chalk.bold('Validation errors:')}`);
            console.log(formatValidationErrors(result.error.validationErrors));
        }

        return;
    }

    // Display operation-specific details
    if (result.data) {
        if ('inputPath' in result.data && 'outputPath' in result.data) {
            console.log(`${chalk.bold('Input:')} ${formatFilePath(result.data.inputPath)}`);
            console.log(`${chalk.bold('Output:')} ${formatFilePath(result.data.outputPath)}`);
        } else if ('schemaPath' in result.data && 'outputPath' in result.data) {
            console.log(`${chalk.bold('Schema:')} ${formatFilePath(result.data.schemaPath)}`);
            console.log(`${chalk.bold('Output:')} ${formatFilePath(result.data.outputPath)}`);
        } else if ('valid' in result.data) {
            console.log(`${chalk.bold('Valid:')} ${result.data.valid}`);
        }
    }
}