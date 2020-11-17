import fs from 'fs'
import path from 'path'

import Lexer from '../src/lexer'
import Parser from '../src/parser'

describe('parser', () => {
    const testCases: { name: string, fixture: string }[] = [
        { name: 'should correctly parse CDDL file', fixture: 'example.cddl' },
        { name: 'can parse compositions', fixture: 'compositions.cddl' },
        { name: 'can parse ranges', fixture: 'ranges.cddl' },
        { name: 'can parse occurrences', fixture: 'occurrences.cddl' },
        { name: 'can parse arrays', fixture: 'arrays.cddl' },
        { name: 'can parse unwrapped arrays', fixture: 'unwrapping.cddl' },
        { name: 'can parse comments', fixture: 'comments.cddl' },
        { name: 'can parse choices', fixture: 'choices.cddl' },
        { name: 'can parse nested groups', fixture: 'nested.cddl' }
    ]

    for (const { name, fixture } of testCases) {
        it(name, () => {
            const input = fs.readFileSync(
                path.join(__dirname, '__fixtures__', fixture),
                'utf-8'
            )

            const l = new Lexer(input)
            const p = new Parser(l)
            expect(p.parse()).toMatchSnapshot()
        })
    }
})