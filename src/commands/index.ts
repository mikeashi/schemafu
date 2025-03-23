import { Command } from 'commander'
import { register as RegisterBundle } from './bundle.js'
import { register as RegisterValidate } from './validate.js'
import { register as RegisterGenerate } from './generate.js'
import { register as RegisterProcess } from './process.js'

export function registerCommands(program: Command) {
   RegisterBundle(program);
   RegisterValidate(program);
   RegisterGenerate(program);
   RegisterProcess(program);
}