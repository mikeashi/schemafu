import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fileExists, ensureDir, writeJsonFile, writeTextFile, resolvePath, readJsonFile } from '../../src/utils/file-utils';
import fs from 'fs/promises';
import path from 'path';

// Mock the fs/promises module
vi.mock('fs/promises', () => ({
    default: {
        access: vi.fn(),
        mkdir: vi.fn(),
        writeFile: vi.fn(),
        readFile: vi.fn()
    }
}));

// Mock the path module
vi.mock('path', () => ({
    default: {
        dirname: vi.fn(),
        isAbsolute: vi.fn(),
        resolve: vi.fn()
    }
}));

// Mock process.cwd() properly
const originalCwd = process.cwd;
beforeEach(() => {
    process.cwd = vi.fn();
});

afterEach(() => {
    process.cwd = originalCwd;
});

describe('resolvePath', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should return the same path if it is absolute', () => {
        // Arrange
        const absolutePath = '/absolute/path/to/file.json';
        vi.mocked(path.isAbsolute).mockReturnValue(true);

        // Act
        const result = resolvePath(absolutePath);

        // Assert
        expect(result).toBe(absolutePath);
        expect(path.isAbsolute).toHaveBeenCalledWith(absolutePath);
        expect(path.resolve).not.toHaveBeenCalled();
    });

    it('should resolve relative path against current working directory', () => {
        // Arrange
        const relativePath = 'relative/path/to/file.json';
        const cwd = '/current/working/directory';
        const resolvedPath = '/current/working/directory/relative/path/to/file.json';

        vi.mocked(path.isAbsolute).mockReturnValue(false);
        vi.mocked(process.cwd).mockReturnValue(cwd);
        vi.mocked(path.resolve).mockReturnValue(resolvedPath);

        // Act
        const result = resolvePath(relativePath);

        // Assert
        expect(result).toBe(resolvedPath);
        expect(path.isAbsolute).toHaveBeenCalledWith(relativePath);
        expect(process.cwd).toHaveBeenCalled();
        expect(path.resolve).toHaveBeenCalledWith(cwd, relativePath);
    });
});



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


describe('readJsonFile', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should read and parse JSON file correctly', async () => {
        // Arrange
        const filePath = '/path/to/file.json';
        const jsonData = { key: 'value', nested: { foo: 'bar' } };
        const fileContent = JSON.stringify(jsonData);
        vi.mocked(fs.readFile).mockResolvedValue(fileContent);

        // Act
        const result = await readJsonFile(filePath);

        // Assert
        expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
        expect(result).toEqual(jsonData);
    });

    it('should throw error if file does not exist', async () => {
        // Arrange
        const filePath = '/path/to/non-existing/file.json';
        const fileError = new Error('ENOENT: no such file or directory');
        vi.mocked(fs.readFile).mockRejectedValue(fileError);

        // Act & Assert
        await expect(readJsonFile(filePath)).rejects.toThrow(fileError);
        expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should throw error if file contains invalid JSON', async () => {
        // Arrange
        const filePath = '/path/to/invalid.json';
        const invalidJson = '{ "key": "value", invalid json }';
        vi.mocked(fs.readFile).mockResolvedValue(invalidJson);

        // Act & Assert
        await expect(readJsonFile(filePath)).rejects.toThrow(SyntaxError);
        expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should respect type parameter for return value', async () => {
        // Arrange
        interface TestType {
            name: string;
            age: number;
        }
        const filePath = '/path/to/typed.json';
        const jsonData: TestType = { name: 'John', age: 30 };
        const fileContent = JSON.stringify(jsonData);
        vi.mocked(fs.readFile).mockResolvedValue(fileContent);

        // Act
        const result = await readJsonFile<TestType>(filePath);

        // Assert
        expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
        expect(result).toEqual(jsonData);

        // Type checking (compile-time only)
        const name: string = result.name;
        const age: number = result.age;
    });
});