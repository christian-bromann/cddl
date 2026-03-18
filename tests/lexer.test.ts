import { describe, it, expect } from 'vitest'

import { Tokens } from '../src/tokens.js'
import Lexer from '../src/lexer.js'

describe('lexer', () => {
    it('should allow to read token', () => {
        const input = '=+(){},/<>'
        const tests = [
            [Tokens.ASSIGN, '='],
            [Tokens.PLUS, '+'],
            [Tokens.LPAREN, '('],
            [Tokens.RPAREN, ')'],
            [Tokens.LBRACE, '{'],
            [Tokens.RBRACE, '}'],
            [Tokens.COMMA, ','],
            [Tokens.SLASH, '/'],
            [Tokens.LT, '<'],
            [Tokens.GT, '>']
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

    it('should correctly report location info', () => {
        const input = 'a = 1'
        const l = new Lexer(input)

        // consume tokens until EOF
        while (l.nextToken().Type !== 'EOF') {}

        // consume more EOFs to push position further
        for (let i = 0; i < 10; ++i) {
            l.nextToken()
        }

        // This should trigger the fallback
        const locEnd = l.getLocation()
        expect(locEnd.line).toBe(0)
        expect(locEnd.position).toBe(0)
    })
})
