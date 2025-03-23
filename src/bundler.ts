import $RefParser from '@apidevtools/json-schema-ref-parser';
import path from 'path';
import { fileExists, ensureDir, writeJsonFile } from './utils/file-utils.js';

export interface BundleOptions {
    /** Whether to pretty-print the JSON output */
    pretty?: boolean;
}


/**
 * Bundles a JSON schema with all its references
 * 
 * @param inputPath - Path to the input schema file
 * @param outputPath - Path to write the bundled schema
 * @param options - Bundling options
 */
export async function bundleSchema(
    inputPath: string,
    outputPath: string,
    options: BundleOptions = {}
): Promise<void> {
    try {
        // Ensure the input file exists
        if (!(await fileExists(inputPath))) {
            throw new Error(`Input file does not exist: ${inputPath}`);
        }

        // Ensure the output directory exists
        const outputDir = path.dirname(outputPath);
        await ensureDir(outputDir);

        // Bundle the schema
        const schema = await $RefParser.bundle(inputPath);

        // Write the bundled schema to the output file
        await writeJsonFile(outputPath, schema, options.pretty);

        return;
    } catch (error: any) {
        // Re-throw with a more descriptive message
        throw new Error(`Failed to bundle schema: ${error.message}\n${error.stack}`);
    }
}