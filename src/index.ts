import Lexer from './lexer.js'
import Parser from './parser.js'

export function parse (filePath: string) {
    const parser = new Parser(filePath)
    return parser.parse()
}

export default { parse }
export { Lexer, Parser }
