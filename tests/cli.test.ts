import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCli, runCli } from '../src/cli';
import { Command } from 'commander';
import { registerCommands } from '../src/commands/index';
import chalk from 'chalk';

// Mock dependencies
vi.mock('commander', () => {
    const mockProgram = {
        name: vi.fn(function () { return mockProgram; }),
        description: vi.fn(function () { return mockProgram; }),
        version: vi.fn(function () { return mockProgram; }),
        parse: vi.fn()
    };

    return {
        Command: vi.fn(() => mockProgram)
    };
});

vi.mock('../src/commands/index', () => ({
    registerCommands: vi.fn()
}));

vi.mock('chalk', () => ({
    default: {
        red: vi.fn(text => `RED:${text}`)
    }
}));

describe('cli', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('createCli', () => {
        it('should create and configure a Commander program', () => {
            // Act
            const program = createCli();

            // Assert
            expect(Command).toHaveBeenCalled();
            expect(program.name).toHaveBeenCalledWith('schemafu');
            expect(program.description).toHaveBeenCalledWith('Bundle, validate, and convert JSON Schema to TypeScript');
            expect(program.version).toHaveBeenCalledWith("0.1.0");
            expect(registerCommands).toHaveBeenCalledWith(program);
        });
    });

    describe('runCli', () => {
        it('should parse arguments and return exit code 0 on success', async () => {
            // Arrange
            const mockProgram = {
                name: vi.fn(function () { return mockProgram; }),
                description: vi.fn(function () { return mockProgram; }),
                version: vi.fn(function () { return mockProgram; }),
                parse: vi.fn()
            };
            vi.mocked(Command).mockReturnValue(mockProgram as unknown as Command);

            // Act
            const result = await runCli(['node', 'schemafu', 'bundle', 'input.json']);

            // Assert
            expect(mockProgram.parse).toHaveBeenCalledWith(['node', 'schemafu', 'bundle', 'input.json']);
            expect(result).toBe(0);
        });

        it('should use process.argv when no args provided', async () => {
            // Arrange
            const originalArgv = process.argv;
            process.argv = ['node', 'schemafu', 'validate', 'schema.json'];

            const mockProgram = {
                name: vi.fn(function () { return mockProgram; }),
                description: vi.fn(function () { return mockProgram; }),
                version: vi.fn(function () { return mockProgram; }),
                parse: vi.fn()
            };
            vi.mocked(Command).mockReturnValue(mockProgram as unknown as Command);

            try {
                // Act
                await runCli();

                // Assert
                expect(mockProgram.parse).toHaveBeenCalledWith(process.argv);
            } finally {
                // Cleanup
                process.argv = originalArgv;
            }
        });

        it('should handle errors and return exit code 1', async () => {
            // Arrange
            const mockError = new Error('Test error');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const mockProgram = {
                name: vi.fn(function () { return mockProgram; }),
                description: vi.fn(function () { return mockProgram; }),
                version: vi.fn(function () { return mockProgram; }),
                parse: vi.fn().mockImplementation(() => {
                    throw mockError;
                })
            };
            vi.mocked(Command).mockReturnValue(mockProgram as unknown as Command);

            // Act
            const result = await runCli(['node', 'schemafu', 'invalid']);

            // Assert
            expect(mockProgram.parse).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('RED:Error running CLI:', mockError.message);
            expect(result).toBe(1);

            // Cleanup
            consoleSpy.mockRestore();
        });
    });
});