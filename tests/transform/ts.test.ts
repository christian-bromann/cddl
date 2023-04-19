import url from 'node:url'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import CDDL, { ParseTargets } from '../../src/index.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const webdriverCDDL = path.join(__dirname, '..', '__fixtures__', 'webdriver.cddl')

describe('transform TS', () => {
    it('should return valid TS types', () => {
        const ts = CDDL.parse(webdriverCDDL, { target: ParseTargets.TS })
        expect(ts).toMatchSnapshot()
    })
})