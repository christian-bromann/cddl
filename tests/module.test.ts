import url from 'node:url'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import CDDL, { ParseTargets } from '../src/index.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const validCDDL = path.join(__dirname, '__fixtures__', 'arrays.cddl')
const buggyCDDL = path.join(__dirname, '__fixtures__', 'buggy.cddl')

describe('validate', () => {
    it('should return a json in success case', () => {
        const ast = CDDL.parse(validCDDL, { target: ParseTargets.AST })
        expect(typeof ast).toBe('object')
        const ts = CDDL.parse(validCDDL, { target: ParseTargets.TS })
        expect(typeof ts).toBe('string')
        // @ts-expect-error
        expect(() => CDDL.parse(buggyCDDL, { target: 'ups' })).toThrow()
    })

    it('should throw an error if invalud', () => {
        expect(() => CDDL.parse(buggyCDDL, { target: ParseTargets.AST }))
            .toThrow()
    })
})