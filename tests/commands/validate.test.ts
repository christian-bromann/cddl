import path from 'path'
import { builder, handler } from '../../src/cli/commands/validate'

const validCDDL = path.join(__dirname, '..', '__fixtures__', 'arrays.cddl')
const buggyCDDL = path.join(__dirname, '..', '__fixtures__', 'buggy.cddl')

describe('validate command', () => {
    it('builder', () => {
        const yargs: any = {}
        yargs.epilogue = jest.fn().mockReturnValue(yargs)
        yargs.help = jest.fn().mockReturnValue(yargs)
        builder(yargs)

        expect(yargs.epilogue).toBeCalledTimes(1)
        expect(yargs.help).toBeCalledTimes(1)
    })

    describe('handler', () => {
        const consoleLogOrig = console.log.bind(console)
        const consoleErrorOrig = console.error.bind(console)
        const processExitOrig = process.exit.bind(process)
        
        beforeEach(() => {
            process.exit = jest.fn<never, [code?: any]>()
            console.log = jest.fn()
            console.error = jest.fn()
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