import Lexer from './lexer'
import { Token, Tokens, TokenType } from './tokens';
import { Group, Property, Type, PropertyName, PropertyType, PropertyReferenceType } from './ast'

const NIL_TOKEN: Token = { Type: Tokens.ILLEGAL, Literal: '' }

export default class Parser {
    l: Lexer;

    curToken: Token = NIL_TOKEN;
    peekToken: Token = NIL_TOKEN;

    constructor (l: Lexer) {
        this.l = l
        
        this.nextToken()
        this.nextToken()
    }

    private nextToken () {
        this.curToken = this.peekToken
        this.peekToken = this.l.nextToken()
        
    }

    private advanceUntil (tok: TokenType) {
        while (this.curToken.Type !== tok) {
            this.nextToken()
        }
        this.nextToken()
    }

    private parseGroup (): Group {
        const token = this.curToken

        if (this.curToken.Type !== Tokens.IDENT && this.peekToken.Type !== Tokens.ASSIGN) {
            throw new Error(`group identifier expected, received "${JSON.stringify(this.curToken)}"`)
        }

        const group: Group = {
            GroupName: this.curToken.Literal,
            Properties: []
        }

        this.advanceUntil(Tokens.LBRACE)

        while (this.curToken.Type !== Tokens.RBRACE) {
            let optional = false
            let propertyName
            let propertyType
            let comment: string = ''

            /**
             * check for optional property
             */
            if (this.curToken.Type === Tokens.QUEST) {
                optional = true
                this.nextToken()
            }

            propertyName = this.parsePropertyName()

            /**
             * if `}` is found we are at the end of the group
             */
            if (this.curToken.Type === Tokens.RBRACE) {
                this.nextToken()
                break
            }

            /**
             * if `,` is found we jump to next line
             */
            else if (this.curToken.Type === Tokens.COMMA) {
                /**
                 * check if line has a comment
                 */
                if (this.peekToken.Type === Tokens.COMMENT) {
                    this.nextToken()
                    comment = this.curToken.Literal
                }

                this.nextToken()
                console.log('No property type')
                continue
            }

            /**
             * else if no colon was found, throw
             */
            else if (this.curToken.Type !== Tokens.COLON) {
                throw new Error('Expected ":"')
            }

            this.nextToken()

            /**
             * parse property value
             */
            propertyType = this.parsePropertyType()

            /**
             * advance comma
             */
            // @ts-ignore
            if (this.curToken.Type === Tokens.COMMA) {
                this.nextToken()
            }

            /**
             * check if line has a comment
             */
            // @ts-ignore
            if (this.curToken.Type === Tokens.COMMENT) {
                comment = this.curToken.Literal
                this.nextToken()
            }

            group.Properties.push({
                Optional: optional,
                Name: propertyName,
                Type: propertyType,
                Comment: comment
            })

            /**
             * if `}` is found we are at the end of the group
             */
            // @ts-ignore
            if (this.curToken.Type === Tokens.RBRACE) {
                this.nextToken()
                break
            }
        }

        return group
    }

    private parsePropertyName (): PropertyName {
        /**
         * property name without quotes
         */
        if (this.curToken.Type === Tokens.IDENT || this.curToken.Type === Tokens.STRING) {
            const name = this.curToken.Literal
            this.nextToken()
            return name
        }

        throw new Error(`Expected property name, received ${this.curToken.Type}(${this.curToken.Literal}), ${this.peekToken.Type}(${this.peekToken.Literal})`)
    }

    private parsePropertyType (): PropertyType {
        let type
        
        switch (this.curToken.Literal) {
            case Type.BOOL:
            case Type.INT:
            case Type.UINT:
            case Type.NINT:
            case Type.FLOAT:
            case Type.FLOAT16:
            case Type.FLOAT32:
            case Type.FLOAT64:
            case Type.BSTR:
            case Type.BYTES:
            case Type.TSTR:
            case Type.TEXT:
                type = this.curToken.Literal
            default: {
                if (this.curToken.Type === Tokens.IDENT) {
                    type = this.curToken.Literal
                } else if (this.curToken.Type === Tokens.STRING || this.curToken.Type === Tokens.NUMBER || this.curToken.Type === Tokens.FLOAT) {
                    type = {
                        Type: 'literal' as PropertyReferenceType,
                        Value: this.curToken.Type === Tokens.NUMBER
                            ? parseInt(this.curToken.Literal, 10)
                            : this.curToken.Type === Tokens.FLOAT
                                ? parseFloat(this.curToken.Literal)
                                : this.curToken.Literal
                    }
                } else {
                    throw new Error(`Invalid property type "${this.curToken.Literal}"`)
                }
            }
        }

        this.nextToken()
        return type
    }

    parse () {
        const definition: Group[] = []

        while (this.curToken.Type !== Tokens.EOF) {
            const group = this.parseGroup()
            if (group) {
                definition.push(group)
            }
            this.nextToken()
        }

        return definition
    }
}