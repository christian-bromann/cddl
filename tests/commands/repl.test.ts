import { describe, it, vi, expect, beforeEach, afterAll } from 'vitest'
import repl from 'node:repl'
import { builder, handler, evaluate } from '../../src/cli/commands/repl.js'
import { Tokens } from '../../src/tokens.js'

describe('repl command', () => {
    it('builder', () => {
        const yargs: any = {}
        yargs.epilogue = vi.fn().mockReturnValue(yargs)
        yargs.help = vi.fn().mockReturnValue(yargs)
        builder(yargs)

        expect(yargs.epilogue).toHaveBeenCalledTimes(1)
        expect(yargs.help).toHaveBeenCalledTimes(1)
    })

    describe('handler', () => {
        it('starts repl', () => {
            const startSpy = vi.spyOn(repl, 'start').mockReturnValue({} as any)
            handler()
            expect(startSpy).toHaveBeenCalledWith(expect.objectContaining({
                prompt: '> ',
                eval: evaluate
            }))
            startSpy.mockRestore()
        })
    })

    describe('evaluate', () => {
        it('returns error if no input', () => {
            const cb = vi.fn()
            evaluate('', {}, '', cb)
            expect(cb).toHaveBeenCalledWith(expect.any(Error), null)
        })

        it('tokenizes input using Lexer', () => {
            const cb = vi.fn()
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            evaluate('foo = 1', {}, '', cb)

            expect(consoleSpy).toHaveBeenCalledTimes(3) // foo, =, 1
            expect(consoleSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ Type: Tokens.IDENT, Literal: 'foo' }))
            expect(consoleSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ Type: Tokens.ASSIGN, Literal: '=' }))
            expect(consoleSpy).toHaveBeenNthCalledWith(3, expect.objectContaining({ Type: Tokens.NUMBER, Literal: '1' }))

            expect(cb).toHaveBeenCalledWith(null, null)

            consoleSpy.mockRestore()
        })
    })
})
