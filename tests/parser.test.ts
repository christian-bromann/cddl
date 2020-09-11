import fs from 'fs'
import path from 'path'

import Lexer from '../src/lexer'
import Parser from '../src/parser'

describe('parser', () => {
    it('should correctly parse CDDL file', () => {
        const input = fs.readFileSync(
            path.join(__dirname, '__fixtures__', 'example.cddl'),
            'utf-8'
        )

        const l = new Lexer(input)
        const p = new Parser(l)
        expect(p.parse()).toMatchSnapshot()
    })

    it('can parse compositions', () => {
        const input = fs.readFileSync(
            path.join(__dirname, '__fixtures__', 'compositions.cddl'),
            'utf-8'
        )

        const l = new Lexer(input)
        const p = new Parser(l)
        expect(p.parse()).toMatchSnapshot()
    })

    it('can parse ranges', () => {
        const input = fs.readFileSync(
            path.join(__dirname, '__fixtures__', 'ranges.cddl'),
            'utf-8'
        )

        const l = new Lexer(input)
        const p = new Parser(l)
        expect(p.parse()).toMatchSnapshot()
    })

    it('can parse occurrences', () => {
        const input = fs.readFileSync(
            path.join(__dirname, '__fixtures__', 'occurrences.cddl'),
            'utf-8'
        )

        const l = new Lexer(input)
        const p = new Parser(l)
        expect(p.parse()).toMatchSnapshot()
    })

    it('can parse arrays', () => {
        const input = fs.readFileSync(
            path.join(__dirname, '__fixtures__', 'arrays.cddl'),
            'utf-8'
        )

        const l = new Lexer(input)
        const p = new Parser(l)
        expect(p.parse()).toMatchSnapshot()
    })
})