import { Command } from "commander";
import { bundelOperation } from "./bundle.js";
import { validateOperation } from "./validate.js";
import { generateOperation } from "./generate.js";
import chalk from "chalk";

export async function processAction(input: string, options: {
    output: string;
    pretty: boolean;
    strict: boolean;
    indent: string;
    banner: string;
    skipValidation: boolean;
    skipGeneration: boolean;
}) {
    let resultPath;

    // Step 1: Bundle the schema
    const bundleResult = await bundelOperation(input, { output: options.output, pretty: options.pretty });
    if (!bundleResult.success || bundleResult.data == null) {
        process.exit(1);
    }

    resultPath = bundleResult.data?.outputPath;

    // Step 2: Validate the schema (if not skipped and previous steps succeeded)
    if (!options.skipValidation) {
        const validateResult = await validateOperation(resultPath, { strict: options.strict });
        if (!validateResult.success) {
            process.exit(1);
        }
    }

    // Step 3: Generate TypeScript (if not skipped and previous steps succeeded)
    if (!options.skipGeneration) {
        const tsOutputPath = resultPath.replace(/\.json$/, '.d.ts');
        const generateResult = await generateOperation(resultPath, { output: tsOutputPath, strict: options.strict, indent: options.indent, banner: options.banner });
        if (!generateResult.success) {
            process.exit(1);
        }
    }

    console.log(chalk.green('\n✓ All operations completed successfully'));
}

export function register(program: Command) {
    program
        .command('process')
        .description('Process a schema: bundle, validate, and generate TypeScript')
        .argument('<input>', 'Input schema file path')
        .option('-o, --output <path>', 'Output bundled schema file path')
        .option('-p, --pretty', 'Pretty print the output JSON', false)
        .option('-s, --strict', 'Use strict validation mode', false)
        .option('-i, --indent <spaces>', 'Indentation spaces for TypeScript', '2')
        .option('--skip-validation', 'Skip validation step', false)
        .option('--skip-generate', 'Skip TypeScript generation step', false)
        .action(processAction);
}
