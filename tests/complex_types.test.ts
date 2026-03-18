import url from 'node:url'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import Parser from '../src/parser.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

describe('complex types', () => {
    it('can parse complex types correctly', () => {
        const p = new Parser(path.join(__dirname, '__fixtures__', 'complex_types.cddl'))
        const ast = p.parse()
        const localValue = ast.find((item: any) => item.Name === 'LocalValue')

        expect(localValue).toBeDefined()
        expect(localValue).toMatchSnapshot()
    })
})
