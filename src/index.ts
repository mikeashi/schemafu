#!/usr/bin/env node
import { runCli } from './cli.js';

runCli()
    .then(exitCode => {
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
