import fs from 'fs'

import Lexer from './lexer'
import Parser from './parser'

export default {
    parse: (filePath: string) => {
        const input = fs.readFileSync(filePath, 'utf-8')
        const l = new Lexer(input)
        const parser = new Parser(l)
        return parser.parse()
    }
}

export { Lexer, Parser }