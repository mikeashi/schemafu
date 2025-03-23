import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAction, register } from '../../src/commands/process';
import { bundleOperation } from '../../src/commands/bundle';
import { validateOperation } from '../../src/commands/validate';
import { generateOperation } from '../../src/commands/generate';
import { Command } from 'commander';
import chalk from 'chalk';

// Mock dependencies
vi.mock('../../src/commands/bundle', () => ({
    bundleOperation: vi.fn()
}));

vi.mock('../../src/commands/validate', () => ({
    validateOperation: vi.fn()
}));

vi.mock('../../src/commands/generate', () => ({
    generateOperation: vi.fn()
}));

vi.mock('chalk', () => ({
    default: {
        green: vi.fn(text => `GREEN:${text}`),
        red: vi.fn(text => `RED:${text}`)
    }
}));

// Don't fully mock commander, just provide what we need for the test
vi.mock('commander', () => {
    return {
        Command: vi.fn()
    };
});

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit unexpectedly called with "${code}"`);
});

describe('processAction', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => { });

        // Setup default successful responses for each operation
        vi.mocked(bundleOperation).mockResolvedValue({
            success: true,
            message: 'Bundle completed',
            duration: 100,
            data: {
                inputPath: '/resolved/input.json',
                outputPath: '/resolved/output.json'
            }
        });

        vi.mocked(validateOperation).mockResolvedValue({
            success: true,
            message: 'Validation completed',
            duration: 50,
            data: {
                valid: true,
                errors:null,
            }
        });

        vi.mocked(generateOperation).mockResolvedValue({
            success: true,
            message: 'Generation completed',
            duration: 75,
            data: {
                schemaPath: '/resolved/output.json',
                outputPath: '/resolved/output.d.ts'
            }
        });
    });

    it('should call all operations in sequence with correct parameters', async () => {
        // Arrange
        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: true,
            strict: true,
            indent: '4',
            banner: '/* Custom banner */',
            skipValidation: false,
            skipGeneration: false
        };

        // Act
        await processAction(input, options);

        // Assert
        expect(bundleOperation).toHaveBeenCalledWith(input, {
            output: options.output,
            pretty: options.pretty
        });

        expect(validateOperation).toHaveBeenCalledWith('/resolved/output.json', {
            strict: options.strict
        });

        expect(generateOperation).toHaveBeenCalledWith('/resolved/output.json', {
            output: '/resolved/output.json'.replace(/\.json$/, '.d.ts'),
            strict: options.strict,
            indent: options.indent,
            banner: options.banner
        });

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('All operations completed successfully'));
    });

    it('should skip validation when skipValidation is true', async () => {
        // Arrange
        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: false,
            strict: false,
            indent: '2',
            banner: '',
            skipValidation: true,
            skipGeneration: false
        };

        // Act
        await processAction(input, options);

        // Assert
        expect(bundleOperation).toHaveBeenCalled();
        expect(validateOperation).not.toHaveBeenCalled();
        expect(generateOperation).toHaveBeenCalled();
    });

    it('should correctly handle skipGeneration flag', async () => {
        // Arrange
        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: false,
            strict: false,
            indent: '2',
            banner: '',
            skipValidation: false,
            skipGeneration: true
        };

        // Act
        await processAction(input, options);

        // Assert
        expect(bundleOperation).toHaveBeenCalled();
        expect(validateOperation).toHaveBeenCalled();
        expect(generateOperation).not.toHaveBeenCalled();
    });

    it('should exit with code 1 if bundle operation fails', async () => {
        // Arrange
        vi.mocked(bundleOperation).mockResolvedValue({
            success: false,
            message: 'Bundle failed',
            duration: 100,
        });

        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: false,
            strict: false,
            indent: '2',
            banner: '',
            skipValidation: false,
            skipGeneration: false
        };

        // Act & Assert
        await expect(processAction(input, options)).rejects.toThrow('process.exit unexpectedly called with "1"');
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(validateOperation).not.toHaveBeenCalled();
        expect(generateOperation).not.toHaveBeenCalled();
    });

    it('should exit with code 1 if validation operation fails', async () => {
        // Arrange
        vi.mocked(validateOperation).mockResolvedValue({
            success: false,
            message: 'Validation failed',
            duration: 50,
        });

        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: false,
            strict: false,
            indent: '2',
            banner: '',
            skipValidation: false,
            skipGeneration: false
        };

        // Act & Assert
        await expect(processAction(input, options)).rejects.toThrow('process.exit unexpectedly called with "1"');
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(bundleOperation).toHaveBeenCalled();
        expect(validateOperation).toHaveBeenCalled();
        expect(generateOperation).not.toHaveBeenCalled();
    });

    it('should exit with code 1 if generation operation fails', async () => {
        // Arrange
        vi.mocked(generateOperation).mockResolvedValue({
            success: false,
            message: 'Generation failed',
            duration: 75,
        });

        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: false,
            strict: false,
            indent: '2',
            banner: '',
            skipValidation: false,
            skipGeneration: false
        };

        // Act & Assert
        await expect(processAction(input, options)).rejects.toThrow('process.exit unexpectedly called with "1"');
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(bundleOperation).toHaveBeenCalled();
        expect(validateOperation).toHaveBeenCalled();
        expect(generateOperation).toHaveBeenCalled();
    });
});

describe('register', () => {
    it('should register the process command with correct options', () => {
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
        expect(commandMock.command).toHaveBeenCalledWith('process');
        expect(commandMock.description).toHaveBeenCalledWith('Process a schema: bundle, validate, and generate TypeScript');
        expect(commandMock.argument).toHaveBeenCalledWith('<input>', 'Input schema file path');
        expect(commandMock.option).toHaveBeenCalledWith('-o, --output <path>', 'Output bundled schema file path');
        expect(commandMock.option).toHaveBeenCalledWith('-p, --pretty', 'Pretty print the output JSON', false);
        expect(commandMock.option).toHaveBeenCalledWith('-s, --strict', 'Use strict validation mode', false);
        expect(commandMock.option).toHaveBeenCalledWith('-i, --indent <spaces>', 'Indentation spaces for TypeScript', '2');
        expect(commandMock.option).toHaveBeenCalledWith('--skip-validation', 'Skip validation step', false);
        expect(commandMock.option).toHaveBeenCalledWith('--skip-generate', 'Skip TypeScript generation step', false);
        expect(commandMock.action).toHaveBeenCalledWith(processAction);
    });
});