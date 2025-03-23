/**
 * Utility functions for formatting CLI output
 */
import chalk from 'chalk';
import { ErrorObject } from 'ajv';

/**
 * Formats validation errors for display
 * 
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ErrorObject[] | null): string {
  if (!errors || errors.length === 0) {
    return 'No errors';
  }
  
  const errorMessages = errors.map(error => {
    const path = error.instancePath || '/';
    const message = error.message || 'Unknown error';
    return `${chalk.bold(path)}: ${message}`;
  });
  
  return errorMessages.join('\n');
}

/**
 * Formats a file path for display (relative to cwd if possible)
 * 
 * @param filePath - The file path to format
 * @returns The formatted file path
 */
export function formatFilePath(filePath: string): string {
  const cwd = process.cwd();
  
  // Check if the file path starts with the cwd
  if (filePath.startsWith(cwd)) {
    return filePath.replace(cwd, '.').replace(/\\/g, '/');
  }
  
  return filePath;
}

/**
 * Formats a duration (in milliseconds) for display
 * 
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  
  const seconds = Math.floor(durationMs / 1000);
  const ms = durationMs % 1000;
  
  return `${seconds}.${ms.toString().padStart(3, '0')}s`;
}