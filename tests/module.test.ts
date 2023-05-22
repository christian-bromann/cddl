import url from 'node:url'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import CDDL from '../src/index.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const validCDDL = path.join(__dirname, '__fixtures__', 'arrays.cddl')
const buggyCDDL = path.join(__dirname, '__fixtures__', 'buggy.cddl')

describe('validate', () => {
    it('should return a json in success case', () => {
        const ast = CDDL.parse(validCDDL)
        expect(typeof ast).toBe('object')
    })

    it('should throw an error if invalud', () => {
        expect(() => CDDL.parse(buggyCDDL))
            .toThrow()
    })
})
