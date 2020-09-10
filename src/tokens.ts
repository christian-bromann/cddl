export type TokenType = string

export type Token = {
    Type: TokenType
    Literal: string
}

export enum Tokens {
    ILLEGAL = 'ILLEGAL',
    EOF = 'EOF',
    NL = '\n',

    // Identifiers + literals,
    IDENT = 'IDENT',
    INT = 'INT',
    COMMENT = 'COMMENT',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    FLOAT = 'FLOAT',

    // Operators,
    ASSIGN = '=',
    PLUS = '+',
    MINUS = '-',
    SLASH = '/',
    QUEST = '?',
    ASTERISK = '*',

    // Delimiters,
    COMMA = ',',
    DOT = '.',
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
