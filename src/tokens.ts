export type TokenType = string

export type Token = {
    Type: TokenType
    Literal: string
}

export enum Tokens {
    ILLEGAL = 'ILLEGAL',
    EOF = 'EOF',

    // Identifiers + literals,
    IDENT = 'IDENT',
    INT = 'INT',
    COMMENT = 'COMMENT',

    // Operators,
    ASSIGN = '=',
    PLUS = '+',
    SLASH = '/',
    QUEST = '?',
    ASTERISK = '*',

    // Delimiters,
    COMMA = ',',
    COLON = ':',
    SEMICOLON = ';',
    LPAREN = '(',
    RPAREN = ')',
    LBRACE = '{',
    RBRACE = '}',
    LBRACK = '[',
    RBRACK = ']',
    QUOT = '"'
}
