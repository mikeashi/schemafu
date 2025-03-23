import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runOperation, displayOperationDetails } from '../../src/utils/cli-utils';
import { formatValidationErrors, formatFilePath, formatDuration } from '../../src/utils/format-utils';
import ora from 'ora';
import chalk from 'chalk';

// Mock dependencies
vi.mock('ora', () => ({
    default: vi.fn(() => ({
        start: vi.fn().mockReturnThis(),
        succeed: vi.fn().mockReturnThis(),
        fail: vi.fn().mockReturnThis()
    }))
}));

vi.mock('../../src/utils/format-utils', () => ({
    formatValidationErrors: vi.fn(),
    formatFilePath: vi.fn(path => `formatted:${path}`),
    formatDuration: vi.fn(ms => `${ms}ms`)
}));

vi.mock('chalk', () => ({
    default: {
        red: vi.fn(text => `RED(${text})`),
        bold: vi.fn(text => `BOLD(${text})`)
    }
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('runOperation', () => {
    let mockOperation: vi.Mock;
    let mockSpinner: { start: vi.Mock, succeed: vi.Mock, fail: vi.Mock };

    beforeEach(() => {
        vi.resetAllMocks();

        // Setup mock spinner
        mockSpinner = {
            start: vi.fn().mockReturnThis(),
            succeed: vi.fn().mockReturnThis(),
            fail: vi.fn().mockReturnThis()
        };
        vi.mocked(ora).mockReturnValue(mockSpinner as any);

        // Setup mock operation
        mockOperation = vi.fn();

        // Mock Date.now
        vi.spyOn(Date, 'now')
            .mockReturnValueOnce(1000) // Start time
            .mockReturnValueOnce(1500); // End time (500ms elapsed)

        // Mock console methods
        console.log = vi.fn();
        console.error = vi.fn();
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;

        // Restore Date.now
        vi.restoreAllMocks();
    });

    it('should handle successful operations', async () => {
        // Arrange
        const operationName = 'Test Operation';
        const operationResult = { foo: 'bar' };
        mockOperation.mockResolvedValue(operationResult);

        // Act
        const result = await runOperation(operationName, mockOperation);

        // Assert
        expect(ora).toHaveBeenCalledWith(`${operationName}...`);
        expect(mockSpinner.start).toHaveBeenCalled();
        expect(mockOperation).toHaveBeenCalled();
        expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining(operationName));
        expect(formatDuration).toHaveBeenCalledWith(500);

        expect(result).toEqual({
            success: true,
            message: `${operationName} completed successfully`,
            duration: 500,
            data: operationResult
        });
    });

    it('should handle operation failures', async () => {
        // Arrange
        const operationName = 'Test Operation';
        const operationError = new Error('Operation failed');
        mockOperation.mockRejectedValue(operationError);

        // Act
        const result = await runOperation(operationName, mockOperation);

        // Assert
        expect(ora).toHaveBeenCalledWith(`${operationName}...`);
        expect(mockSpinner.start).toHaveBeenCalled();
        expect(mockOperation).toHaveBeenCalled();
        expect(mockSpinner.fail).toHaveBeenCalledWith(`${operationName} failed`);

        expect(result).toEqual({
            success: false,
            message: 'Operation failed',
            duration: 500,
            error: operationError
        });
    });
});

describe('displayOperationDetails', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock console methods
        console.log = vi.fn();
        console.error = vi.fn();
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    it('should display error message for failed operations', () => {
        // Arrange
        const result = {
            success: false,
            message: 'Operation failed',
            duration: 500,
            error: new Error('Test error')
        };

        // Act
        displayOperationDetails(result);

        // Assert
        expect(console.error).toHaveBeenCalledWith('RED(Operation failed)');
        expect(chalk.red).toHaveBeenCalledWith('Operation failed');
    });

    it('should display validation errors if present as an array', () => {
        // Arrange
        const validationErrors = [{ instancePath: '/test', message: 'error', keyword: 'type', params: {}, schemaPath: '' }];
        const result = {
            success: false,
            message: 'Validation failed',
            duration: 500,
            error: Object.assign(new Error('Validation error'), { validationErrors })
        };

        vi.mocked(formatValidationErrors).mockReturnValue('Formatted validation errors');

        // Act
        displayOperationDetails(result);

        // Assert
        expect(console.error).toHaveBeenCalledWith('RED(Validation failed)');
        expect(console.log).toHaveBeenCalledWith('\nBOLD(Validation errors:)');
        expect(console.log).toHaveBeenCalledWith('Formatted validation errors');
        expect(formatValidationErrors).toHaveBeenCalledWith(validationErrors);
    });

    it('should display validation errors when validationErrors is null', () => {
        // Arrange
        const result = {
            success: false,
            message: 'Validation failed with null errors',
            duration: 500,
            error: Object.assign(new Error('Validation error'), { validationErrors: null })
        };

        vi.mocked(formatValidationErrors).mockReturnValue('No errors');

        // Act
        displayOperationDetails(result);

        // Assert
        expect(console.error).toHaveBeenCalledWith('RED(Validation failed with null errors)');
        expect(console.log).toHaveBeenCalledWith('\nBOLD(Validation errors:)');
        expect(console.log).toHaveBeenCalledWith('No errors');
        expect(formatValidationErrors).toHaveBeenCalledWith(null);
    });

    it('should display input/output paths for bundle operations', () => {
        // Arrange
        const result = {
            success: true,
            message: 'Bundle completed',
            duration: 500,
            data: {
                inputPath: '/path/to/input',
                outputPath: '/path/to/output'
            }
        };

        // Act
        displayOperationDetails(result);

        // Assert
        expect(console.log).toHaveBeenCalledWith('BOLD(Input:) formatted:/path/to/input');
        expect(console.log).toHaveBeenCalledWith('BOLD(Output:) formatted:/path/to/output');
        expect(formatFilePath).toHaveBeenCalledWith('/path/to/input');
        expect(formatFilePath).toHaveBeenCalledWith('/path/to/output');
    });

    it('should display schema/output paths for convert operations', () => {
        // Arrange
        const result = {
            success: true,
            message: 'Convert completed',
            duration: 500,
            data: {
                schemaPath: '/path/to/schema',
                outputPath: '/path/to/output'
            }
        };

        // Act
        displayOperationDetails(result);

        // Assert
        expect(console.log).toHaveBeenCalledWith('BOLD(Schema:) formatted:/path/to/schema');
        expect(console.log).toHaveBeenCalledWith('BOLD(Output:) formatted:/path/to/output');
        expect(formatFilePath).toHaveBeenCalledWith('/path/to/schema');
        expect(formatFilePath).toHaveBeenCalledWith('/path/to/output');
    });

    it('should display validation result for validate operations', () => {
        // Arrange
        const result = {
            success: true,
            message: 'Validation completed',
            duration: 500,
            data: {
                valid: true
            }
        };

        // Act
        displayOperationDetails(result);

        // Assert
        expect(console.log).toHaveBeenCalledWith('BOLD(Valid:) true');
    });

    it('should handle operations with no specific data', () => {
        // Arrange
        const result = {
            success: true,
            message: 'Operation completed',
            duration: 500
        };

        // Act
        displayOperationDetails(result);

        // Assert
        expect(console.log).not.toHaveBeenCalled();
    });
});