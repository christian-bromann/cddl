import url from 'node:url'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import Parser from '../src/parser.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

describe('examples', () => {
    describe('common', () => {
        const testCases: { name: string, fixture: string }[] = [
            { name: 'can parse group choice', fixture: 'group_choice.cddl' },
            { name: 'can parse literals', fixture: 'literals.cddl' },
            { name: 'can parse mixin union', fixture: 'mixin_union.cddl' },
            { name: 'can parse named group choice', fixture: 'named_group_choice.cddl' }
        ]

        for (const { name, fixture } of testCases) {
            it(name, async () => {
                const p = new Parser(path.join(__dirname, '__fixtures__', fixture))
                expect(p.parse()).toMatchSnapshot()
            })
        }
    })
})
