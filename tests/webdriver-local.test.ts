import url from 'node:url'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import Parser from '../src/parser.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

describe('webdriver local cddl', () => {
    it('can parse local.cddl', () => {
        const filePath = path.join(__dirname, '../examples/webdriver/local.cddl')
        const p = new Parser(filePath)
        expect(p.parse()).toMatchSnapshot()
    })
})
