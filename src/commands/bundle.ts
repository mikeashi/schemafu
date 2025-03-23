import { Command } from 'commander'
import { resolvePath} from '../utils/file-utils.js';
import { displayOperationDetails, runOperation } from '../utils/cli-utils.js';
import defaultConfig from "../utils/config.js";
import { bundleSchema } from '../bundler.js';


export async function bundleOperation(input: string, options: { output: string; pretty: boolean }){
    const inputPath = resolvePath(input);
    const outputPath = options.output
        ? resolvePath(options.output)
        : resolvePath(defaultConfig.OutputPath);

    const result = await runOperation('Bundling schema', async () => {
        await bundleSchema(inputPath, outputPath, {
            pretty: options.pretty
        });

        return { inputPath, outputPath };
    });

    displayOperationDetails(result);
    return result;
}


export async function bundleAction(input: string, options: {output: string; pretty: boolean}) {
    bundleOperation(input, options);
}

export function register(program: Command) {
    program
        .command('bundle')
        .description('Bundle a JSON schema with all its references')
        .argument('<input>', 'Input schema file path')
        .option('-o, --output <path>', 'Output file path')
        .option('-p, --pretty', 'Pretty print the output JSON', false)
        .action(bundleAction)
}
