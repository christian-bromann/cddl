import { Tokens, Token } from './tokens.js'

export function isLetter (ch: string): boolean {
    return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z'
}

export function isAlphabeticCharacter (ch: string): boolean {
    return isLetter(ch) || ch === Tokens.ATSIGN || ch === Tokens.UNDERSCORE || ch === Tokens.DOLLAR
}

export function isDigit (ch: string): boolean {
    return !isNaN(ch as unknown as number) && ch !== Tokens.NL && ch !== Tokens.SPACE
}

export function hasSpecialNumberCharacter (ch: number) {
    return (
        ch === Tokens.MINUS.charCodeAt(0) ||
        ch === Tokens.DOT.charCodeAt(0) ||
        ch === 'x'.charCodeAt(0) ||
        ch === 'b'.charCodeAt(0)
    )
}

export function parseNumberValue (token: Token): string | number {
    if (token.Type === Tokens.FLOAT) {
        return parseFloat(token.Literal)
    }

    if (
        token.Literal.includes('x') ||
        token.Literal.includes('b')
    ) {
        return token.Literal
    }

    return parseInt(token.Literal, 10)
}
