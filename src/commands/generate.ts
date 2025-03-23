import { Command } from 'commander'
import { displayOperationDetails, runOperation } from '../utils/cli-utils.js';
import { resolvePath } from '../utils/file-utils.js';
import { generateTypeScript } from '../generator.js';
import defaultConfig from "../utils/config.js";


export async function generateOperation(input: string, options: { output: string, strict: boolean, indent: string, banner: string }) {
    const schemaPath = resolvePath(input);
    const outputPath = options.output
        ? resolvePath(options.output)
        : schemaPath.replace(/\.json$/, '.d.ts');

    const result = await runOperation('Generating TypeScript interfaces', async () => {
        await generateTypeScript(schemaPath, outputPath, {
            strictTypes: options.strict,
            indentation: parseInt(options.indent || defaultConfig.Indentation.toString(), 10),
            banner: options.banner
        });

        return { schemaPath, outputPath };
    });

    displayOperationDetails(result);
    return result;
}


export async function generateAction(input: string, options: { output: string, strict: boolean, indent: string, banner: string }) {
    generateOperation(input, options);
}


export function register(program: Command) {
    program
        .command('generate')
        .alias('ts')
        .description('Generate TypeScript interfaces from a JSON schema')
        .argument('<schema>', 'Schema file path')
        .option('-o, --output <path>', 'Output TypeScript file path')
        .option('-s, --strict', 'Use strict types', false)
        .option('-i, --indent <spaces>', 'Indentation spaces', '2')
        .option('-b, --banner <text>', 'Custom banner comment')
        .action(generateAction)
}
