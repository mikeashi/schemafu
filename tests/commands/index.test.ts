import { describe, it, expect, vi } from 'vitest';
import { registerCommands } from '../../src/commands/index';
import { Command } from 'commander';

// Mock all the register functions from the imported modules
vi.mock('../../src/commands/bundle.js', () => ({
    register: vi.fn()
}));

vi.mock('../../src/commands/validate.js', () => ({
    register: vi.fn()
}));

vi.mock('../../src/commands/generate.js', () => ({
    register: vi.fn()
}));

vi.mock('../../src/commands/process.js', () => ({
    register: vi.fn()
}));

// Import the mocked functions after mocking
import { register as RegisterBundle } from '../../src/commands/bundle.js';
import { register as RegisterValidate } from '../../src/commands/validate.js';
import { register as RegisterGenerate } from '../../src/commands/generate.js';
import { register as RegisterProcess } from '../../src/commands/process.js';

// Don't fully mock commander, just provide what we need for the test
vi.mock('commander', () => {
    return {
        Command: vi.fn()
    };
});

describe('registerCommands', () => {
    it('should register all command modules with the provided program', () => {
        // Arrange
        const programMock = {} as Command;

        // Act
        registerCommands(programMock);

        // Assert
        expect(RegisterBundle).toHaveBeenCalledWith(programMock);
        expect(RegisterValidate).toHaveBeenCalledWith(programMock);
        expect(RegisterGenerate).toHaveBeenCalledWith(programMock);
        expect(RegisterProcess).toHaveBeenCalledWith(programMock);
    });

    it('should register commands in the correct order', () => {
        // Arrange
        const programMock = {} as Command;

        // Reset call history
        vi.mocked(RegisterBundle).mockClear();
        vi.mocked(RegisterValidate).mockClear();
        vi.mocked(RegisterGenerate).mockClear();
        vi.mocked(RegisterProcess).mockClear();

        // Act
        registerCommands(programMock);

        // Assert - verify call order
        expect(vi.mocked(RegisterBundle).mock.invocationCallOrder[0])
            .toBeLessThan(vi.mocked(RegisterValidate).mock.invocationCallOrder[0]);

        expect(vi.mocked(RegisterValidate).mock.invocationCallOrder[0])
            .toBeLessThan(vi.mocked(RegisterGenerate).mock.invocationCallOrder[0]);

        expect(vi.mocked(RegisterGenerate).mock.invocationCallOrder[0])
            .toBeLessThan(vi.mocked(RegisterProcess).mock.invocationCallOrder[0]);
    });
});