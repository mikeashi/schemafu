import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bundelAction, register } from '../../src/commands/bundle';
import { resolvePath } from '../../src/utils/file-utils';
import { runOperation, displayOperationDetails } from '../../src/utils/cli-utils';
import defaultConfig from '../../src/utils/config';
import { bundleSchema } from '../../src/bundler';
import { Command } from 'commander';

// Mock dependencies
vi.mock('../../src/utils/file-utils', () => ({
    resolvePath: vi.fn(path => `/resolved/${path}`)
}));

vi.mock('../../src/utils/cli-utils', () => ({
    runOperation: vi.fn(),
    displayOperationDetails: vi.fn()
}));

vi.mock('../../src/bundler', () => ({
    bundleSchema: vi.fn()
}));

vi.mock('../../src/utils/config', () => ({
    default: {
        OutputPath: 'default-output.json'
    }
}));

// Don't mock commander for now
vi.mock('commander', () => {
    return {
        Command: vi.fn()
    };
});

describe('bundelAction', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Setup runOperation to return a success result
        vi.mocked(runOperation).mockResolvedValue({
            success: true,
            message: 'Bundle completed',
            duration: 500,
            data: {
                inputPath: '/resolved/input.json',
                outputPath: '/resolved/output.json'
            }
        });
    });

    it('should resolve input path and use provided output path', async () => {
        // Arrange
        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: false
        };

        // Act
        await bundelAction(input, options);

        // Assert
        expect(resolvePath).toHaveBeenCalledWith(input);
        expect(resolvePath).toHaveBeenCalledWith(options.output);
        expect(resolvePath).not.toHaveBeenCalledWith(defaultConfig.OutputPath);

        expect(runOperation).toHaveBeenCalledWith(
            'Bundling schema',
            expect.any(Function)
        );

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        expect(bundleSchema).toHaveBeenCalledWith(
            '/resolved/input.json',
            '/resolved/output.json',
            { pretty: false }
        );

        expect(displayOperationDetails).toHaveBeenCalledWith({
            success: true,
            message: 'Bundle completed',
            duration: 500,
            data: {
                inputPath: '/resolved/input.json',
                outputPath: '/resolved/output.json'
            }
        });
    });

    it('should use default output path when not provided', async () => {
        // Arrange
        const input = 'input.json';
        const options = {
            output: '',
            pretty: false
        };

        // Act
        await bundelAction(input, options);

        // Assert
        expect(resolvePath).toHaveBeenCalledWith(input);
        expect(resolvePath).toHaveBeenCalledWith(defaultConfig.OutputPath);

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        expect(bundleSchema).toHaveBeenCalledWith(
            '/resolved/input.json',
            `/resolved/${defaultConfig.OutputPath}`,
            { pretty: false }
        );
    });

    it('should pass pretty option to bundleSchema', async () => {
        // Arrange
        const input = 'input.json';
        const options = {
            output: 'output.json',
            pretty: true
        };

        // Act
        await bundelAction(input, options);

        // Get the operation function and test it
        const operationFn = vi.mocked(runOperation).mock.calls[0][1];
        await operationFn();

        // Assert
        expect(bundleSchema).toHaveBeenCalledWith(
            '/resolved/input.json',
            '/resolved/output.json',
            { pretty: true }
        );
    });
});

describe('register', () => {
    it('should register the bundle command with correct options', () => {
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
        expect(commandMock.command).toHaveBeenCalledWith('bundle');
        expect(commandMock.description).toHaveBeenCalledWith('Bundle a JSON schema with all its references');
        expect(commandMock.argument).toHaveBeenCalledWith('<input>', 'Input schema file path');
        expect(commandMock.option).toHaveBeenCalledWith('-o, --output <path>', 'Output file path');
        expect(commandMock.option).toHaveBeenCalledWith('-p, --pretty', 'Pretty print the output JSON', false);
        expect(commandMock.action).toHaveBeenCalledWith(bundelAction);
    });
});