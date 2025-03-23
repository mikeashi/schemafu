import { compile } from 'json-schema-to-typescript';
import path from 'path';
import { readJsonFile, writeTextFile } from './utils/file-utils';

export interface TypeScriptGeneratorOptions {
    /** Whether to generate strict types */
    strictTypes?: boolean;
    /** Banner comment to add at the top of the generated file */
    banner?: string;
    /** Indentation spaces */
    indentation?: number;
}


/**
 * Generates TypeScript interfaces from a JSON schema
 * 
 * @param schemaPath - Path to the JSON schema file
 * @param outputPath - Path to write the TypeScript definition file
 * @param options - TypeScript generation options
 */
export async function generateTypeScript(
    schemaPath: string,
    outputPath: string,
    options: TypeScriptGeneratorOptions = {}
): Promise<void> {
    try {
        // Read and parse the schema file
        const schema = await readJsonFile(schemaPath);

        // Compile the schema to TypeScript
        const typescript = await compile(schema, schema.title || 'Schema', {
            bannerComment: options.banner || `/* Generated from ${path.basename(schemaPath)} */`,
            style: {
                singleQuote: true,
                semi: true,
                tabWidth: options.indentation || 2,
            },
            strictIndexSignatures: options.strictTypes || false,
        });

        // Write the TypeScript definition file
        await writeTextFile(outputPath, typescript);
    } catch (error: any) {
        throw new Error(`Failed to generate TypeScript: ${error.message}`);
    }
}