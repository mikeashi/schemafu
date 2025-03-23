import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateAction, register } from '../../src/commands/validate';
import { resolvePath } from '../../src/utils/file-utils';
import { runOperation, displayOperationDetails } from '../../src/utils/cli-utils';
import { validateSchema } from '../../src/validator';
import { Command } from 'commander';

// Mock dependencies
vi.mock('../../src/utils/file-utils', () => ({
    resolvePath: vi.fn(path => `/resolved/${path}`)
}));

vi.mock('../../src/utils/cli-utils', () => ({
    runOperation: vi.fn(),
    displayOperationDetails: vi.fn()
}));

vi.mock('../../src/validator', () => ({
    validateSchema: vi.fn()
}));

// Don't fully mock commander, just provide what we need for the test
vi.mock('commander', () => {
    return {
        Command: vi.fn()
    };
});

describe('validateAction', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Setup runOperation to return a success result
        vi.mocked(runOperation).mockResolvedValue({
            success: true,
            message: 'Validation completed',
            duration: 300,
            data: {
                valid: true
            }
        });
    });

    it('should resolve input path and call validateSchema', async () => {
        // Arrange
        const input = 'schema.json';
        const options = { strict: false };

        vi.mocked(validateSchema).mockResolvedValue({
            valid: true,
            errors: null
        });

        // Act
        await validateAction(input, options);

        // Assert
        expect(resolvePath).toHaveBeenCalledWith(input);
        expect(runOperation).toHaveBeenCalledWith(
            'Validating schema',
            expect.any(Function)
        );

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        expect(validateSchema).toHaveBeenCalledWith(
            '/resolved/schema.json',
            { strict: false }
        );

        expect(displayOperationDetails).toHaveBeenCalledWith({
            success: true,
            message: 'Validation completed',
            duration: 300,
            data: {
                valid: true
            }
        });
    });

    it('should pass strict option to validateSchema', async () => {
        // Arrange
        const input = 'schema.json';
        const options = { strict: true };

        vi.mocked(validateSchema).mockResolvedValue({
            valid: true,
            errors: null
        });

        // Act
        await validateAction(input, options);

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        // Assert
        expect(validateSchema).toHaveBeenCalledWith(
            '/resolved/schema.json',
            { strict: true }
        );
    });

    it('should throw error with validation errors when schema is invalid', async () => {
        // Arrange
        const input = 'schema.json';
        const options = { strict: false };
        const validationErrors = [{ keyword: 'type', message: 'Invalid type' }];

        vi.mocked(validateSchema).mockResolvedValue({
            valid: false,
            errors: validationErrors 
        } as any);

        // Act
        await validateAction(input, options);

        // Get the operation function
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];

        // Test that it throws an error with validation details
        await expect(operationFn()).rejects.toThrow('Schema validation failed');
        try {
            await operationFn();
        } catch (error: any) {
            expect(error.validationErrors).toBe(validationErrors);
        }
    });
});

describe('register', () => {
    it('should register the validate command with correct options', () => {
        // Create a minimal mock with just the methods we need
        const commandMock = {
            command: vi.fn().mockReturnThis(),
            description: vi.fn().mockReturnThis(),
            argument: vi.fn().mockReturnThis(),
            option: vi.fn().mockReturnThis(),
            action: vi.fn().mockReturnThis()
        };

        // Act
        register(commandMock as unknown as Command);

        // Assert
        expect(commandMock.command).toHaveBeenCalledWith('validate');
        expect(commandMock.description).toHaveBeenCalledWith('Validate a JSON schema against meta-schema');
        expect(commandMock.argument).toHaveBeenCalledWith('<input>', 'Input schema file path');
        expect(commandMock.option).toHaveBeenCalledWith('-s, --strict', 'Use strict validation mode', false);
        expect(commandMock.action).toHaveBeenCalledWith(validateAction);
    });
});