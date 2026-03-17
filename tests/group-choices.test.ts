import { describe, it, expect, vi, beforeEach } from 'vitest'
import Parser from '../src/parser.js'
import * as fs from 'node:fs'

vi.mock('node:fs')

describe('Group Choice Parsing', () => {
    const parse = (cddl: string) => {
        vi.mocked(fs.readFileSync).mockReturnValue(cddl)
        const parser = new Parser('dummy.cddl')
        return parser.parse()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Group Choice (//)', () => {
        it('should verify group choice operator //', () => {
            const cddl = `
                mygroup = (int // text)
            `
            const ast = parse(cddl)
            expect(ast).toMatchSnapshot()
        })

        it('should throw error when group choice operator // is at start of group', () => {
            const cddl = `
                mygroup = (// int)
            `
            expect(() => parse(cddl)).toThrowError('Unexpected group choice operator "//" at start of group')
        })

        it('should parse nested group choice', () => {
            const cddl = `
                mygroup = ((int // text))
            `
            const ast = parse(cddl)
            expect(ast).toMatchSnapshot()
        })

        it('should parse group choice with multiple items', () => {
             const cddl = `
                mygroup = (int, text // float)
            `
            const ast = parse(cddl)
            expect(ast).toMatchSnapshot()
        })
    })

    describe('Map Group Choice', () => {
        it('should parse group choice inside map', () => {
            const cddl = `
                mymap = {
                    "a" => 1 //
                    "b" => 2
                }
            `
            const ast = parse(cddl)
            expect(ast).toMatchSnapshot()
        })
    })

    describe('Type Choice (/)', () => {
        it('should parse type choice inside group', () => {
             const cddl = `
                mygroup = (int / text)
            `
            const ast = parse(cddl)
            expect(ast).toMatchSnapshot()
        })

        // This tests the change: closingTokens.includes(Tokens.RPAREN) && this.peekToken.Type === Tokens.SLASH
        it('should correctly handle slash in mixed context', () => {
            const cddl = `
                myrule = [ (int / text) ]
            `
            const ast = parse(cddl)
            expect(ast).toMatchSnapshot()
        })
    })

    describe('Blocks with Braces', () => {
        // Covers changes in openSegment and parseAssignmentValue regarding Tokens.LBRACE
        it('should parse nested group inside map', () => {
            // This relates to the removal of special LPAREN handling inside LBRACE in openSegment
            const cddl = `
                myrule = { (int) }
            `
            const ast = parse(cddl)
            // Expecting parsing to succeed and structure to be correct
            expect(ast).toMatchSnapshot()
        })

         it('should parse bare group inside brace', () => {
            const cddl = `
                myrule = { int }
            `
            const ast = parse(cddl)
            expect(ast).toMatchSnapshot()
        })
    })
})
