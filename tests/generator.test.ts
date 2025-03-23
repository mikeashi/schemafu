import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTypeScript } from '../src/generator';
import { compile } from 'json-schema-to-typescript';
import { readJsonFile, writeTextFile } from '../src/utils/file-utils';
import path from 'path';

// Mock dependencies
vi.mock('json-schema-to-typescript', () => ({
    compile: vi.fn()
}));

vi.mock('../src/utils/file-utils', () => ({
    readJsonFile: vi.fn(),
    writeTextFile: vi.fn()
}));

vi.mock('path', () => ({
    default: {
        basename: vi.fn()
    }
}));

describe('generateTypeScript', () => {
    const schemaPath = '/path/to/schema.json';
    const outputPath = '/path/to/types.ts';
    const mockSchema = {
        type: 'object',
        title: 'TestSchema',
        properties: { foo: { type: 'string' } }
    };
    const mockTypescript = 'export interface TestSchema { foo: string; }';

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(readJsonFile).mockResolvedValue(mockSchema);
        vi.mocked(compile).mockResolvedValue(mockTypescript);
        vi.mocked(path.basename).mockReturnValue('schema.json');
        vi.mocked(writeTextFile).mockResolvedValue(undefined);
    });

    it('should generate TypeScript from schema successfully', async () => {
        // Act
        await generateTypeScript(schemaPath, outputPath);

        // Assert
        expect(readJsonFile).toHaveBeenCalledWith(schemaPath);
        expect(path.basename).toHaveBeenCalledWith(schemaPath);
        expect(compile).toHaveBeenCalledWith(
            mockSchema,
            'TestSchema',
            expect.objectContaining({
                bannerComment: '/* Generated from schema.json */',
                style: {
                    singleQuote: true,
                    semi: true,
                    tabWidth: 2,
                },
                strictIndexSignatures: false,
            })
        );
        expect(writeTextFile).toHaveBeenCalledWith(outputPath, mockTypescript);
    });

    it('should use default title when schema title is not provided', async () => {
        // Arrange
        const schemaWithoutTitle = {
            type: 'object',
            properties: { foo: { type: 'string' } }
        };
        vi.mocked(readJsonFile).mockResolvedValue(schemaWithoutTitle);

        // Act
        await generateTypeScript(schemaPath, outputPath);

        // Assert
        expect(compile).toHaveBeenCalledWith(
            schemaWithoutTitle,
            'Schema',
            expect.any(Object)
        );
    });

    it('should apply custom options when provided', async () => {
        // Arrange
        const options = {
            strictTypes: true,
            banner: '/* Custom banner */',
            indentation: 4
        };

        // Act
        await generateTypeScript(schemaPath, outputPath, options);

        // Assert
        expect(compile).toHaveBeenCalledWith(
            mockSchema,
            'TestSchema',
            expect.objectContaining({
                bannerComment: '/* Custom banner */',
                style: {
                    singleQuote: true,
                    semi: true,
                    tabWidth: 4,
                },
                strictIndexSignatures: true,
            })
        );
    });

    it('should throw error when schema file cannot be read', async () => {
        // Arrange
        const fileError = new Error('File not found');
        vi.mocked(readJsonFile).mockRejectedValue(fileError);

        // Act & Assert
        await expect(generateTypeScript(schemaPath, outputPath))
            .rejects.toThrow('Failed to generate TypeScript: File not found');

        expect(compile).not.toHaveBeenCalled();
        expect(writeTextFile).not.toHaveBeenCalled();
    });

    it('should throw error when schema compilation fails', async () => {
        // Arrange
        const compileError = new Error('Invalid schema');
        vi.mocked(compile).mockRejectedValue(compileError);

        // Act & Assert
        await expect(generateTypeScript(schemaPath, outputPath))
            .rejects.toThrow('Failed to generate TypeScript: Invalid schema');

        expect(readJsonFile).toHaveBeenCalled();
        expect(compile).toHaveBeenCalled();
        expect(writeTextFile).not.toHaveBeenCalled();
    });

    it('should throw error when writing TypeScript file fails', async () => {
        // Arrange
        const writeError = new Error('Permission denied');
        vi.mocked(writeTextFile).mockRejectedValue(writeError);

        // Act & Assert
        await expect(generateTypeScript(schemaPath, outputPath))
            .rejects.toThrow('Failed to generate TypeScript: Permission denied');

        expect(readJsonFile).toHaveBeenCalled();
        expect(compile).toHaveBeenCalled();
        expect(writeTextFile).toHaveBeenCalled();
    });
});