import repl from 'repl'
import yargs from 'yargs'

import { CLI_EPILOGUE } from '../constants'
import Lexer from '../../lexer'
import { Tokens } from '../../tokens'

export const command = 'repl'
export const desc = 'Run CDDL repl'
export const builder = (yargs: yargs.Argv<{}>) => {
    return yargs
        .epilogue(CLI_EPILOGUE)
        .help()
}

export const handler = (argv: yargs.Arguments) => {
    const r = repl.start({
        prompt: '> ',
        eval: evaluate
    })
}

export function evaluate (evalCmd: string, _: any, file: string, callback: (err: Error | null, result: any) => void) {
    if (!evalCmd) {
        return callback(new Error('No input'), null)
    }

    const l = new Lexer(evalCmd)
    for (let tok = l.nextToken(); tok.Type !== Tokens.EOF; tok = l.nextToken()) {
        console.log(tok)
    }
    return callback(null, null)
}