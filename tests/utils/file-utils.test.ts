import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fileExists, ensureDir, writeJsonFile, writeTextFile } from '../../src/utils/file-utils';
import fs from 'fs/promises';
import path from 'path';

// Mock the fs/promises module
vi.mock('fs/promises', () => ({
    default: {
        access: vi.fn(),
        mkdir: vi.fn(),
        writeFile: vi.fn()
    }
}));

// Mock the path module
vi.mock('path', () => ({
    default: {
        dirname: vi.fn()
    }
}));

describe('fileExists', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should return true if file exists', async () => {
        // Arrange
        const filePath = '/path/to/existing/file.json';
        vi.mocked(fs.access).mockResolvedValue(undefined);

        // Act
        const result = await fileExists(filePath);

        // Assert
        expect(result).toBe(true);
        expect(fs.access).toHaveBeenCalledWith(filePath);
    });

    it('should return false if file does not exist', async () => {
        // Arrange
        const filePath = '/path/to/non-existing/file.json';
        vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

        // Act
        const result = await fileExists(filePath);

        // Assert
        expect(result).toBe(false);
        expect(fs.access).toHaveBeenCalledWith(filePath);
    });
});

describe('ensureDir', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should create directory if it does not exist', async () => {
        // Arrange
        const dirPath = '/path/to/dir';
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);

        // Act
        await ensureDir(dirPath);

        // Assert
        expect(fs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should not throw error if directory already exists', async () => {
        // Arrange
        const dirPath = '/path/to/existing/dir';
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);

        // Act & Assert
        await expect(ensureDir(dirPath)).resolves.not.toThrow();
        expect(fs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });
});

describe('writeJsonFile', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(path.dirname).mockReturnValue('/path/to');
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it('should write JSON data to file with no pretty-printing', async () => {
        // Arrange
        const filePath = '/path/to/file.json';
        const data = { key: 'value', nested: { foo: 'bar' } };

        // Act
        await writeJsonFile(filePath, data);

        // Assert
        expect(path.dirname).toHaveBeenCalledWith(filePath);
        expect(fs.mkdir).toHaveBeenCalledWith('/path/to', { recursive: true });
        expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify(data));
    });

    it('should write pretty-printed JSON data to file when pretty=true', async () => {
        // Arrange
        const filePath = '/path/to/file.json';
        const data = { key: 'value', nested: { foo: 'bar' } };

        // Act
        await writeJsonFile(filePath, data, true);

        // Assert
        expect(path.dirname).toHaveBeenCalledWith(filePath);
        expect(fs.mkdir).toHaveBeenCalledWith('/path/to', { recursive: true });
        expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify(data, null, 2));
    });
});

describe('writeTextFile', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(path.dirname).mockReturnValue('/path/to');
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it('should write text content to file', async () => {
        // Arrange
        const filePath = '/path/to/file.txt';
        const content = 'Hello, world!';

        // Act
        await writeTextFile(filePath, content);

        // Assert
        expect(path.dirname).toHaveBeenCalledWith(filePath);
        expect(fs.mkdir).toHaveBeenCalledWith('/path/to', { recursive: true });
        expect(fs.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should create directory if it does not exist', async () => {
        // Arrange
        const filePath = '/path/to/non-existing/dir/file.txt';
        const content = 'Hello, world!';
        vi.mocked(path.dirname).mockReturnValue('/path/to/non-existing/dir');

        // Act
        await writeTextFile(filePath, content);

        // Assert
        expect(path.dirname).toHaveBeenCalledWith(filePath);
        expect(fs.mkdir).toHaveBeenCalledWith('/path/to/non-existing/dir', { recursive: true });
        expect(fs.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should handle errors from writeFile', async () => {
        // Arrange
        const filePath = '/path/to/file.txt';
        const content = 'Hello, world!';
        const writeError = new Error('Failed to write file');
        vi.mocked(fs.writeFile).mockRejectedValue(writeError);

        // Act & Assert
        await expect(writeTextFile(filePath, content)).rejects.toThrow(writeError);
        expect(path.dirname).toHaveBeenCalledWith(filePath);
        expect(fs.mkdir).toHaveBeenCalledWith('/path/to', { recursive: true });
    });
});