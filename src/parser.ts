import Lexer from './lexer'
import { Token, Tokens } from './tokens';
import { PREDEFINED_IDENTIFIER } from './constants'
import { parseNumberValue } from './utils'
import {
    Group, Type, PropertyName, PropertyType, PropertyReferenceType,
    Variable, RangePropertyReference
} from './ast'

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
        return true
    }

    private parseGroupOrVariableAssignments (): Group | Variable {
        if (this.curToken.Type !== Tokens.IDENT && this.peekToken.Type !== Tokens.ASSIGN) {
            throw new Error(`group identifier expected, received "${JSON.stringify(this.curToken)}"`)
        }

        const group: Group = {
            Name: this.curToken.Literal,
            Properties: []
        }

        this.nextToken() // eat group identifier
        this.nextToken() // eat `=`
        const closingTokens = this.openGroupSegment()

        /**
         * if no group segment was opened we have a variable assignment
         */
        if (!closingTokens) {
            const variable: Variable = {
                Name: group.Name,
                PropertyType: this.parsePropertyType()
            }
            return variable
        }

        while (!closingTokens.includes(this.curToken.Type)) {
            let optional = false
            let propertyName = ''
            let propertyType: PropertyType[] = []
            let comment = ''

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
            if (closingTokens.includes(this.curToken.Type)) {
                this.nextToken()
                break
            }

            /**
             * if `,` is found we have a group reference and jump to the next line
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
                group.Properties.push({
                    Optional: optional,
                    Name: '',
                    Type: [{
                        Type: 'group' as PropertyReferenceType,
                        Value: propertyName
                    }],
                    Comment: comment
                })
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
            propertyType.push(this.parsePropertyType())
            this.nextToken()
            // @ts-ignore
            while (this.curToken.Type === Tokens.SLASH) {
                this.nextToken() // eat `/`
                propertyType.push(this.parsePropertyType())
                this.nextToken()
            }

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
                comment = this.curToken.Literal.slice(2)
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
            if (closingTokens.includes(this.curToken.Type)) {
                break
            }
        }

        return group
    }

    /**
     * checks if group segment is opened and forwards to beginning of
     * first property declaration
     * @returns {String[]}  closing tokens for group (either `}`, `)` or both)
     */
    private openGroupSegment (): string[] | void {
        if (this.curToken.Type === Tokens.LBRACE) {
            this.nextToken()

            if (this.peekToken.Type === Tokens.LPAREN) {
                this.nextToken()
                return [Tokens.RPAREN, Tokens.RBRACE]
            }
            return [Tokens.RBRACE]
        } else if (this.curToken.Type === Tokens.LPAREN) {
            this.nextToken()
            return [Tokens.RPAREN]
        }
    }

    private parsePropertyName (): PropertyName {
        /**
         * property name without quotes
         */
        if (this.curToken.Type === Tokens.IDENT || this.curToken.Type === Tokens.STRING) {
            const name = this.curToken.Literal

            if (PREDEFINED_IDENTIFIER.includes(name)) {
                throw new Error(`Name ${name} is a reserved word`)
            }

            this.nextToken()
            return name
        }

        throw new Error(`Expected property name, received ${this.curToken.Type}(${this.curToken.Literal}), ${this.peekToken.Type}(${this.peekToken.Literal})`)
    }

    private parsePropertyType (): PropertyType {
        let type: PropertyType
        
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
                } else if (this.curToken.Type === Tokens.STRING) {
                    type = {
                        Type: 'literal' as PropertyReferenceType,
                        Value: this.curToken.Literal
                    }
                } else if (this.curToken.Type === Tokens.NUMBER || this.curToken.Type === Tokens.FLOAT) {
                    type = {
                        Type: 'literal' as PropertyReferenceType,
                        Value: parseNumberValue(this.curToken)
                    }
                } else {
                    throw new Error(`Invalid property type "${this.curToken.Literal}"`)
                }
            }
        }

        /**
         * check if type continue as a range
         */
        if (
            this.peekToken.Type === Tokens.DOT &&
            this.nextToken() &&
            this.peekToken.Type === Tokens.DOT
        ) {
            this.nextToken()
            let Inclusive = true

            /**
             * check if range excludes upper bound
             */
            if (this.peekToken.Type === Tokens.DOT) {
                Inclusive = false
                this.nextToken()
            }

            this.nextToken()
            const Min: RangePropertyReference = typeof type === 'string'
                ? type as string
                : type.Value as (number | string)
            type = {
                Type: 'range' as PropertyReferenceType,
                Value: {
                    Inclusive,
                    Min,
                    Max: this.parsePropertyType() as RangePropertyReference
                }
            }
        }

        return type
    }

    parse () {
        const definition: (Group | Variable)[] = []

        while (this.curToken.Type !== Tokens.EOF) {
            const group = this.parseGroupOrVariableAssignments()
            if (group) {
                definition.push(group)
            }
            this.nextToken()
        }

        return definition
    }
}