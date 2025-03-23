import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAction, register } from '../../src/commands/generate';
import { resolvePath } from '../../src/utils/file-utils';
import { runOperation, displayOperationDetails } from '../../src/utils/cli-utils';
import { generateTypeScript } from '../../src/generator';
import { Command } from 'commander';

// Mock dependencies
vi.mock('../../src/utils/file-utils', () => ({
    resolvePath: vi.fn(path => `/resolved/${path}`)
}));

vi.mock('../../src/utils/cli-utils', () => ({
    runOperation: vi.fn(),
    displayOperationDetails: vi.fn()
}));

vi.mock('../../src/generator', () => ({
    generateTypeScript: vi.fn()
}));

vi.mock('../../src/utils/config', () => ({
    default: {
        Indentation: 4 // Default indentation value for testing
    }
}));

// Don't fully mock commander, just provide what we need for the test
vi.mock('commander', () => {
    return {
        Command: vi.fn()
    };
});

describe('generateAction', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Setup runOperation to return a success result
        vi.mocked(runOperation).mockResolvedValue({
            success: true,
            message: 'TypeScript generation completed',
            duration: 300,
            data: {
                schemaPath: '/resolved/schema.json',
                outputPath: '/resolved/schema.d.ts'
            }
        });

        vi.mocked(generateTypeScript).mockResolvedValue(undefined);
    });

    it('should use provided output path when specified', async () => {
        // Arrange
        const input = 'schema.json';
        const options = {
            output: 'types.d.ts',
            strict: false,
            indent: '2',
            banner: ''
        };

        // Act
        await generateAction(input, options);

        // Assert
        expect(resolvePath).toHaveBeenCalledWith(input);
        expect(resolvePath).toHaveBeenCalledWith(options.output);

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        expect(generateTypeScript).toHaveBeenCalledWith(
            '/resolved/schema.json',
            '/resolved/types.d.ts',
            {
                strictTypes: false,
                indentation: 2,
                banner: ''
            }
        );

        expect(displayOperationDetails).toHaveBeenCalled();
    });

    it('should derive output path from input path when no output specified', async () => {
        // Arrange
        const input = 'schema.json';
        const options = {
            output: '',
            strict: false,
            indent: '2',
            banner: ''
        };

        // Act
        await generateAction(input, options);

        // Assert
        expect(resolvePath).toHaveBeenCalledWith(input);
        expect(resolvePath).not.toHaveBeenCalledWith(options.output);

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        // Verifies it changed .json to .d.ts
        expect(generateTypeScript).toHaveBeenCalledWith(
            '/resolved/schema.json',
            '/resolved/schema.json'.replace(/\.json$/, '.d.ts'),
            expect.any(Object)
        );
    });

    it('should pass all options to generateTypeScript', async () => {
        // Arrange
        const input = 'schema.json';
        const options = {
            output: 'types.d.ts',
            strict: true,
            indent: '4',
            banner: '/* Custom banner */'
        };

        // Act
        await generateAction(input, options);

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        // Assert
        expect(generateTypeScript).toHaveBeenCalledWith(
            '/resolved/schema.json',
            '/resolved/types.d.ts',
            {
                strictTypes: true,
                indentation: 4,
                banner: '/* Custom banner */'
            }
        );
    });

    it('should use default indentation when indent is not provided', async () => {
        // Arrange
        const input = 'schema.json';
        const options = {
            output: 'types.d.ts',
            strict: false,
            indent: '',
            banner: ''
        };

        // Act
        await generateAction(input, options);

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        // Assert - should use the default indentation from config
        expect(generateTypeScript).toHaveBeenCalledWith(
            '/resolved/schema.json',
            '/resolved/types.d.ts',
            {
                strictTypes: false,
                indentation: 4, // Default from config mock
                banner: ''
            }
        );
    });
});

describe('register', () => {
    it('should register the generate command with correct options', () => {
        // Create a minimal mock with just the methods we need
        const commandMock = {
            command: vi.fn().mockReturnThis(),
            alias: vi.fn().mockReturnThis(),
            description: vi.fn().mockReturnThis(),
            argument: vi.fn().mockReturnThis(),
            option: vi.fn().mockReturnThis(),
            action: vi.fn().mockReturnThis()
        };

        // Act
        register(commandMock as unknown as Command);

        // Assert
        expect(commandMock.command).toHaveBeenCalledWith('generate');
        expect(commandMock.alias).toHaveBeenCalledWith('ts');
        expect(commandMock.description).toHaveBeenCalledWith('Generate TypeScript interfaces from a JSON schema');
        expect(commandMock.argument).toHaveBeenCalledWith('<schema>', 'Schema file path');
        expect(commandMock.option).toHaveBeenCalledWith('-o, --output <path>', 'Output TypeScript file path');
        expect(commandMock.option).toHaveBeenCalledWith('-s, --strict', 'Use strict types', false);
        expect(commandMock.option).toHaveBeenCalledWith('-i, --indent <spaces>', 'Indentation spaces', '2');
        expect(commandMock.option).toHaveBeenCalledWith('-b, --banner <text>', 'Custom banner comment');
        expect(commandMock.action).toHaveBeenCalledWith(generateAction);
    });
});