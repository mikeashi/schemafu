import fs from 'fs/promises';
import path from 'path';

/**
 * Checks if a file exists
 * 
 * @param filePath - The file path to check
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}


/**
 * Ensures a directory exists, creating it if necessary
 * 
 * @param dirPath - The directory path to ensure exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Writes JSON content to a file
 * 
 * @param filePath - Path to write the file
 * @param data - Data to write
 * @param pretty - Whether to pretty-print the JSON
 */
export async function writeJsonFile(
    filePath: string,
    data: any,
    pretty = false
): Promise<void> {
    const indent = pretty ? 2 : 0;
    const content = JSON.stringify(data, null, indent);

    await writeTextFile(filePath, content);
}

/**
 * Writes text content to a file
 * 
 * @param filePath - Path to write the file
 * @param content - Text content to write
 */
export async function writeTextFile(
    filePath: string,
    content: string
): Promise<void> {
    // Ensure the directory exists
    const dirPath = path.dirname(filePath);
    await ensureDir(dirPath);

    await fs.writeFile(filePath, content);
}