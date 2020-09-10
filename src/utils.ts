export function isLetter (ch: string): boolean {
    return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || ch === '_'
}

export function isDigit (ch: string): boolean {
    return !isNaN(ch as unknown as number)
}