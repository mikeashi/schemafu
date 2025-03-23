import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSchema } from '../src/validator';
import { readJsonFile } from '../src/utils/file-utils';
import { Ajv } from 'ajv';

// Mock dependencies
vi.mock('ajv', () => {
    return {
        Ajv: vi.fn().mockImplementation(() => {
            return {
                compile: vi.fn(),
                // Return a minimal implementation that typecheck will accept
            } as unknown as Ajv;
        })
    };
});

vi.mock('../src/utils/file-utils', () => ({
    readJsonFile: vi.fn()
}));

describe('validateSchema', () => {
    const schemaPath = '/path/to/schema.json';
    const mockSchema = { type: 'object', properties: { foo: { type: 'string' } } };

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(readJsonFile).mockResolvedValue(mockSchema);
    });

    it('should validate a schema successfully', async () => {
        // Arrange
        const mockCompile = vi.fn().mockReturnValue(() => true);
        vi.mocked(Ajv).mockImplementation(() => ({
            compile: mockCompile
        } as unknown as Ajv));

        // Act
        const result = await validateSchema(schemaPath);

        // Assert
        expect(readJsonFile).toHaveBeenCalledWith(schemaPath);
        expect(Ajv).toHaveBeenCalledWith({
            strict: false,
            allErrors: true
        });
        expect(mockCompile).toHaveBeenCalledWith(mockSchema);
        expect(result).toEqual({
            valid: true,
            errors: null
        });
    });

    it('should respect strict option when provided', async () => {
        // Arrange
        const mockCompile = vi.fn().mockReturnValue(() => true);
        vi.mocked(Ajv).mockImplementation(() => ({
            compile: mockCompile
        } as unknown as Ajv));
        const options = { strict: true };

        // Act
        await validateSchema(schemaPath, options);

        // Assert
        expect(Ajv).toHaveBeenCalledWith({
            strict: true,
            allErrors: true
        });
    });

    it('should handle validation failures', async () => {
        // Arrange
        const mockErrors = [{ keyword: 'type', message: 'Invalid type' }];
        const compileError = new Error('Invalid schema') as Error & { errors: any[] };
        compileError.errors = mockErrors;

        const mockCompile = vi.fn().mockImplementation(() => {
            throw compileError;
        });

        vi.mocked(Ajv).mockImplementation(() => ({
            compile: mockCompile
        } as unknown as Ajv));

        // Act
        const result = await validateSchema(schemaPath);

        // Assert
        expect(result).toEqual({
            valid: false,
            errors: mockErrors
        });
    });

    it('should handle validation errors without error details', async () => {
        // Arrange
        const compileError = new Error('Invalid schema structure');

        const mockCompile = vi.fn().mockImplementation(() => {
            throw compileError;
        });

        vi.mocked(Ajv).mockImplementation(() => ({
            compile: mockCompile
        } as unknown as Ajv));

        // Act
        const result = await validateSchema(schemaPath);

        // Assert
        expect(result).toEqual({
            valid: false,
            errors: [{ message: 'Invalid schema structure' }]
        });
    });

    it('should throw an error if schema file cannot be read', async () => {
        // Arrange
        const fileError = new Error('File not found');
        vi.mocked(readJsonFile).mockRejectedValue(fileError);

        // Act & Assert
        await expect(validateSchema(schemaPath)).rejects.toThrow('Failed to validate schema: File not found');
    });
});