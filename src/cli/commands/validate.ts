import fs from 'node:fs'
import path from 'node:path'
import type yargs from 'yargs'

import { CLI_EPILOGUE } from '../constants.js'
import CDDL from '../../index.js'

interface ValidateArguments extends yargs.Arguments {
    filePath: string
}

export const command = 'validate <filePath>'
export const desc = 'Validate a *.cddl file'
export const builder = (yargs: yargs.Argv<{}>) => {
    return yargs
        .epilogue(CLI_EPILOGUE)
        .help()
}

export const handler = (argv: ValidateArguments) => {
    const filePath = argv.filePath.startsWith('/')
        ? argv.filePath
        : path.resolve(process.cwd(), argv.filePath)
    
    if (!fs.existsSync(filePath)) {
        console.error(`Couldn't find CDDL file at ${filePath}`)
        return process.exit(1)
    }

    try {
        CDDL.parse(filePath)

        /**
         * ToDo check for
         *  - missing group declarations
         */

        console.log('✅ Valid CDDL file!')
    } catch (err: unknown) {
        console.error(`⚠️  Invalid CDDL file (${filePath})\n\t> ${(err as Error).message}`)
        process.exit(1)
    }
}