import { Command } from 'commander'
import { register as RegisterBundle} from './bundle.js'

export function registerCommands(program: Command) {
   RegisterBundle(program);
}