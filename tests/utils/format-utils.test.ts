import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatValidationErrors, formatFilePath, formatDuration } from '../../src/utils/format-utils';
import chalk from 'chalk';
import { ErrorObject } from 'ajv';

// Mock chalk
vi.mock('chalk', () => ({
    default: {
        bold: vi.fn((text) => `BOLD(${text})`),
    }
}));

// Store original process.cwd
const originalCwd = process.cwd;

describe('formatValidationErrors', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should return "No errors" when errors array is null', () => {
        // Act
        const result = formatValidationErrors(null);

        // Assert
        expect(result).toBe('No errors');
    });

    it('should return "No errors" when errors array is empty', () => {
        // Act
        const result = formatValidationErrors([]);

        // Assert
        expect(result).toBe('No errors');
    });

    it('should format validation errors with instancePath', () => {
        // Arrange
        const errors: ErrorObject[] = [
            { instancePath: '/properties/name', message: 'should be string', keyword: 'type', params: {}, schemaPath: '' },
            { instancePath: '/properties/age', message: 'should be number', keyword: 'type', params: {}, schemaPath: '' }
        ];

        // Act
        const result = formatValidationErrors(errors);

        // Assert
        expect(result).toBe('BOLD(/properties/name): should be string\nBOLD(/properties/age): should be number');
        expect(chalk.bold).toHaveBeenCalledWith('/properties/name');
        expect(chalk.bold).toHaveBeenCalledWith('/properties/age');
    });

    it('should use root path (/) when instancePath is empty', () => {
        // Arrange
        const errors: ErrorObject[] = [
            { instancePath: '', message: 'should be object', keyword: 'type', params: {}, schemaPath: '' }
        ];

        // Act
        const result = formatValidationErrors(errors);

        // Assert
        expect(result).toBe('BOLD(/): should be object');
        expect(chalk.bold).toHaveBeenCalledWith('/');
    });

    it('should handle errors without message', () => {
        // Arrange
        const errors: ErrorObject[] = [
            { instancePath: '/properties/name', keyword: 'type', params: {}, schemaPath: '' }
        ];

        // Act
        const result = formatValidationErrors(errors);

        // Assert
        expect(result).toBe('BOLD(/properties/name): Unknown error');
        expect(chalk.bold).toHaveBeenCalledWith('/properties/name');
    });
});

describe('formatFilePath', () => {
    beforeEach(() => {
        // Mock process.cwd
        process.cwd = vi.fn().mockReturnValue('/current/working/dir');
    });

    afterEach(() => {
        // Restore process.cwd
        process.cwd = originalCwd;
    });

    it('should format path relative to cwd when path starts with cwd', () => {
        // Arrange
        const filePath = '/current/working/dir/path/to/file.json';

        // Act
        const result = formatFilePath(filePath);

        // Assert
        expect(result).toBe('./path/to/file.json');
        expect(process.cwd).toHaveBeenCalled();
    });

    it('should return unmodified path when path does not start with cwd', () => {
        // Arrange
        const filePath = '/other/path/to/file.json';

        // Act
        const result = formatFilePath(filePath);

        // Assert
        expect(result).toBe(filePath);
        expect(process.cwd).toHaveBeenCalled();
    });

    it('should handle backslashes in path on Windows', () => {
        // Arrange
        const filePath = '/current/working/dir\\path\\to\\file.json';

        // Act
        const result = formatFilePath(filePath);

        // Assert
        expect(result).toBe('./path/to/file.json');
    });
});

describe('formatDuration', () => {
    it('should format durations less than 1 second in milliseconds', () => {
        // Arrange
        const durationMs = 750;

        // Act
        const result = formatDuration(durationMs);

        // Assert
        expect(result).toBe('750ms');
    });

    it('should format durations of 1 second or more in seconds', () => {
        // Arrange
        const durationMs = 1500;

        // Act
        const result = formatDuration(durationMs);

        // Assert
        expect(result).toBe('1.500s');
    });

    it('should pad milliseconds with leading zeros when needed', () => {
        // Arrange
        const durationMs = 2050;

        // Act
        const result = formatDuration(durationMs);

        // Assert
        expect(result).toBe('2.050s');
    });

    it('should handle durations with single-digit milliseconds', () => {
        // Arrange
        const durationMs = 3001;

        // Act
        const result = formatDuration(durationMs);

        // Assert
        expect(result).toBe('3.001s');
    });
});