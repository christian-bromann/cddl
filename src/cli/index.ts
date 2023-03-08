import yargs from 'yargs'

import { CLI_EPILOGUE } from './constants.js'

export default function () {
    const argv: yargs.Argv<{}> = yargs
        .commandDir('commands')
        .example('$0 repl', 'Start CDDL repl')
        .epilogue(CLI_EPILOGUE)
    
    return argv.argv
}