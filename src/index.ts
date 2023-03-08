import fs from 'node:fs'

import Lexer from './lexer.js'
import Parser from './parser.js'

export default {
    parse: (filePath: string) => {
        const input = fs.readFileSync(filePath, 'utf-8')
        const l = new Lexer(input)
        const parser = new Parser(l)
        return parser.parse()
    }
}

export { Lexer, Parser }