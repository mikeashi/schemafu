import chalk from 'chalk';
import { Command } from 'commander'
import { registerCommands } from './commands/index.js'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');


/**
 * Creates and configures the CLI program
 * @returns Configured Commander program
 */
export function createCli(): Command {
    const program = new Command();

    program
        .name('schemafu')
        .description('Bundle, validate, and convert JSON Schema to TypeScript')
        .version(version);

    registerCommands(program)

    return program;
}



/**
 * Runs the CLI with the given arguments
 * @param args Command line arguments
 * @returns Exit code
 */
export function runCli(args: string[] = process.argv): Promise<number> {
    const program = createCli();

    return new Promise(resolve => {
        try {
            program.parse(args);
            resolve(0);
        } catch (error: any) {
            console.error(chalk.red('Error running CLI:'), error.message);
            resolve(1);
        }
    });
}
