import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

import * as replCommand from './commands/repl.js'
import * as validateCommand from './commands/validate.js'
import { CLI_EPILOGUE } from './constants.js'

export default async function () {
    const argv = yargs(hideBin(process.argv))
        .command(replCommand)
        .command(validateCommand as any)
        .example('$0 repl', 'Start CDDL repl')
        .epilogue(CLI_EPILOGUE)
        .demandCommand()
        .help()

    return argv.argv
}