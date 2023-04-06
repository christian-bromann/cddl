import url from 'node:url'
import path from 'node:path'
import { describe, it, vi, expect, beforeEach, afterAll } from 'vitest'
import { builder, handler } from '../../src/cli/commands/validate.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const validCDDL = path.join(__dirname, '..', '__fixtures__', 'arrays.cddl')
const buggyCDDL = path.join(__dirname, '..', '__fixtures__', 'buggy.cddl')

describe('validate command', () => {
    it('builder', () => {
        const yargs: any = {}
        yargs.epilogue = vi.fn().mockReturnValue(yargs)
        yargs.help = vi.fn().mockReturnValue(yargs)
        builder(yargs)

        expect(yargs.epilogue).toBeCalledTimes(1)
        expect(yargs.help).toBeCalledTimes(1)
    })

    describe('handler', () => {
        const consoleLogOrig = console.log.bind(console)
        const consoleErrorOrig = console.error.bind(console)
        const processExitOrig = process.exit.bind(process)
        
        beforeEach(() => {
            process.exit = vi.fn()
            console.log = vi.fn()
            console.error = vi.fn()
        })

        afterAll(() => {
            process.exit = processExitOrig
            console.log = consoleLogOrig
            console.error = consoleErrorOrig
        })

        it('fails if file does not exist', () => {
            handler({ filePath: '/foo/bar', _: [], $0: '' })
            expect(process.exit).toBeCalledTimes(1)
            expect(console.error).toBeCalledTimes(1)
            expect(process.exit).toBeCalledWith(1)
        })

        it('fails if cddl file is buggy', () => {
            handler({ filePath: buggyCDDL, _: [], $0: '' })
            expect(process.exit).toBeCalledTimes(1)
            expect(console.error).toBeCalledTimes(1)
            expect(process.exit).toBeCalledWith(1)
        })

        it('passes if cddl file is valid', () => {
            handler({ filePath: validCDDL, _: [], $0: '' })
            expect(process.exit).toBeCalledTimes(0)
            expect(console.log).toBeCalledTimes(1)
        })
    })
})