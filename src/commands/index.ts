import { Command } from 'commander'
import { register as RegisterBundle } from './bundle.js'
import { register as RegisterValidate } from './validate.js'

export function registerCommands(program: Command) {
   RegisterBundle(program);
   RegisterValidate(program);
}