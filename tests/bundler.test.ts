import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bundleSchema } from '../src/bundler';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { fileExists, ensureDir, writeJsonFile } from '../src/utils/file-utils';
import path from 'path';

// Mock the dependencies
vi.mock('@apidevtools/json-schema-ref-parser', () => ({
    default: {
        bundle: vi.fn()
    }
}));

vi.mock('../src/utils/file-utils', () => ({
    fileExists: vi.fn(),
    ensureDir: vi.fn(),
    writeJsonFile: vi.fn()
}));

vi.mock('path', () => ({
    default: {
        dirname: vi.fn()
    }
}));

describe('bundleSchema', () => {
    const inputPath = '/path/to/input.json';
    const outputPath = '/path/to/output/bundled.json';
    const outputDir = '/path/to/output';
    const mockSchema = { type: 'object', properties: { foo: { type: 'string' } } };

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(path.dirname).mockReturnValue(outputDir);
        vi.mocked(fileExists).mockResolvedValue(true);
        vi.mocked(ensureDir).mockResolvedValue(undefined);
        vi.mocked($RefParser.bundle).mockResolvedValue(mockSchema);
        vi.mocked(writeJsonFile).mockResolvedValue(undefined);
    });

    it('should successfully bundle a schema', async () => {
        // Act
        await bundleSchema(inputPath, outputPath);

        // Assert
        expect(fileExists).toHaveBeenCalledWith(inputPath);
        expect(path.dirname).toHaveBeenCalledWith(outputPath);
        expect(ensureDir).toHaveBeenCalledWith(outputDir);
        expect($RefParser.bundle).toHaveBeenCalledWith(inputPath);
        expect(writeJsonFile).toHaveBeenCalledWith(outputPath, mockSchema, undefined);
    });

    it('should throw an error if input file does not exist', async () => {
        // Arrange
        vi.mocked(fileExists).mockResolvedValue(false);

        // Act & Assert
        await expect(bundleSchema(inputPath, outputPath)).rejects.toThrow();

        expect(fileExists).toHaveBeenCalledWith(inputPath);
        expect(ensureDir).not.toHaveBeenCalled();
        expect($RefParser.bundle).not.toHaveBeenCalled();
        expect(writeJsonFile).not.toHaveBeenCalled();
    });

    it('should use pretty printing when specified in options', async () => {
        // Arrange
        const options = { pretty: true };

        // Act
        await bundleSchema(inputPath, outputPath, options);

        // Assert
        expect(fileExists).toHaveBeenCalledWith(inputPath);
        expect(path.dirname).toHaveBeenCalledWith(outputPath);
        expect(ensureDir).toHaveBeenCalledWith(outputDir);
        expect($RefParser.bundle).toHaveBeenCalledWith(inputPath);
        expect(writeJsonFile).toHaveBeenCalledWith(outputPath, mockSchema, true);
    });

    it('should handle errors from the bundling process', async () => {
        // Arrange
        const bundleError = new Error('Bundle failed');
        vi.mocked($RefParser.bundle).mockRejectedValueOnce(bundleError);

        // Act & Assert
        await expect(bundleSchema(inputPath, outputPath)).rejects.toThrow();

        expect(fileExists).toHaveBeenCalledWith(inputPath);
        expect(path.dirname).toHaveBeenCalledWith(outputPath);
        expect(ensureDir).toHaveBeenCalledWith(outputDir);
        expect($RefParser.bundle).toHaveBeenCalledWith(inputPath);
        expect(writeJsonFile).not.toHaveBeenCalled();
    });
});