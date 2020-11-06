import path from 'path'
import CDDL from '../src'

const validCDDL = path.join(__dirname, '__fixtures__', 'arrays.cddl')
const buggyCDDL = path.join(__dirname, '__fixtures__', 'buggy.cddl')

describe('validate', () => {
    it('should return a json in success case', () => {
        const ast = CDDL.parse(validCDDL)
        expect(typeof ast).toBe('object')
    })

    it('should throw an error if invalud', () => {
        expect(() => CDDL.parse(buggyCDDL)).toThrow()
    })
})