import { describe, it, expect } from 'vitest'

import { Tokens } from '../src/tokens.js'
import Lexer from '../src/lexer.js'

describe('lexer', () => {
    it('should allow to read token', () => {
        const input = '=+(){},/'
        const tests = [
            [Tokens.ASSIGN, '='],
            [Tokens.PLUS, '+'],
            [Tokens.LPAREN, '('],
            [Tokens.RPAREN, ')'],
            [Tokens.LBRACE, '{'],
            [Tokens.RBRACE, '}'],
            [Tokens.COMMA, ','],
            [Tokens.SLASH, '/']
        ]

        const l = new Lexer(input)
        for (const [Type, Literal] of tests) {
            const token = l.nextToken()
            expect(token.Type).toBe(Type)
            expect(token.Literal).toBe(Literal)
        }
    })

    it('should read identifiers and comments', () => {
        const input = '   headers,       ; Headers for the recipient'
        const tests = [
            [Tokens.IDENT, 'headers'],
            [Tokens.COMMA, ','],
            [Tokens.COMMENT, '; Headers for the recipient']
        ]

        const l = new Lexer(input)
        for (const [Type, Literal] of tests) {
            const token = l.nextToken()
            expect(token.Type).toBe(Type)
            expect(token.Literal).toBe(Literal)
        }
    })
})