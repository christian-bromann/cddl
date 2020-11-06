import Lexer from './lexer'
import { Property } from './ast'
import { Token, Tokens } from './tokens';
import { PREDEFINED_IDENTIFIER, BOOLEAN_LITERALS } from './constants'
import { parseNumberValue } from './utils'
import {
    Type, PropertyName, PropertyType, PropertyReferenceType,
    Variable, RangePropertyReference, Occurrence, Assignment,
    Comment
} from './ast'

const NIL_TOKEN: Token = { Type: Tokens.ILLEGAL, Literal: '' }
const DEFAULT_OCCURRENCE: Occurrence = { n: 1, m: 1 } // exactly one time

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

    private parseAssignments (): Assignment {
        /**
         * expect group identifier, e.g.
         * groupName =
         * groupName /=
         * groupName //=
         */
        if (this.curToken.Type !== Tokens.IDENT || !(this.peekToken.Type === Tokens.ASSIGN || this.peekToken.Type === Tokens.SLASH)) {
            throw new Error(`group identifier expected, received "${JSON.stringify(this.curToken)}"`)
        }

        let isChoiceAddition = false
        const groupName = this.curToken.Literal
        this.nextToken() // eat group identifier

        // @ts-ignore
        if (this.curToken.Type === Tokens.SLASH) {
            isChoiceAddition = true
            this.nextToken() // eat `/`
        }

        // @ts-ignore
        if (this.curToken.Type === Tokens.SLASH) {
            this.nextToken() // eat `/`
        }

        this.nextToken() // eat `=`
        return this.parseAssignmentValue(groupName, isChoiceAddition) as Assignment
    }

    private parseAssignmentValue (groupName?: string, isChoiceAddition = false): Assignment | PropertyType[] {
        let isChoice = false
        const valuesOrProperties: (Property | Property[])[] = []
        const closingTokens = this.openSegment()

        /**
         * if no group segment was opened we have a variable assignment
         * and can return immediatelly
         */
        if (closingTokens.length === 0) {
            if (groupName) {
                const variable: Variable = {
                    Type: 'variable',
                    Name: groupName,
                    IsChoiceAddition: isChoiceAddition,
                    PropertyType: this.parsePropertyTypes()
                }
                return variable
            }

            return this.parsePropertyTypes()
        }
    
        while (!closingTokens.includes(this.curToken.Type)) {
            const propertyType: PropertyType[] = []
            let isUnwrapped = false
            let hasCut = false
            let propertyName = ''
            let comment = ''

            const occurrence = this.parseOccurrences()

            /**
             * check if variable name is unwrapped
             */
            if (this.curToken.Literal === Tokens.TILDE) {
                isUnwrapped = true
                this.nextToken() // eat ~
            }

            propertyName = this.parsePropertyName()

            /**
             * if `,` is found we have a group reference and jump to the next line
             */
            if (this.curToken.Type === Tokens.COMMA || closingTokens.includes(this.curToken.Type)) {
                const tokenType = this.curToken.Type
                let parsedComments = false

                /**
                 * check if line has a comment
                 */
                if (this.curToken.Type === Tokens.COMMA && this.peekToken.Type === Tokens.COMMENT) {
                    this.nextToken()
                    comment = this.parseComment()
                    parsedComments = true
                }

                valuesOrProperties.push({
                    HasCut: hasCut,
                    Occurrence: occurrence,
                    Name: '',
                    Type: PREDEFINED_IDENTIFIER.includes(propertyName)
                        ? propertyName
                        : [{
                            Type: 'group' as PropertyReferenceType,
                            Value: propertyName,
                            Unwrapped: isUnwrapped
                        }],
                    Comment: comment
                })

                if (!parsedComments) {
                    this.nextToken()
                }

                /**
                 * only continue if next token contains a comma
                 */
                if (tokenType === Tokens.COMMA) {
                    continue
                }

                /**
                 * otherwise break
                 */
                break
            }

            /**
             * check if property has cut, which happens if a property is described as
             * - `? "optional-key" ^ => int,`
             * - `? optional-key: int,` - since the colon shortcut includes cuts
             */
            if (this.curToken.Type === Tokens.CARET || this.curToken.Type === Tokens.COLON) {
                hasCut = true

                if (this.curToken.Type === Tokens.CARET) {
                    this.nextToken() // eat ^
                }
            }

            /**
             * check if we have a choice instead of an assignment
             */
            if (this.curToken.Type === Tokens.SLASH && this.peekToken.Type === Tokens.SLASH) {
                const prop: Property = {
                    HasCut: hasCut,
                    Occurrence: occurrence,
                    Name: '',
                    Type: {
                        Type: "group",
                        Value: propertyName,
                        Unwrapped: isUnwrapped
                    },
                    Comment: comment
                }

                if (isChoice) {
                    /**
                     * if we already in a choice just push into it
                     */
                    (valuesOrProperties[valuesOrProperties.length - 1] as Property[]).push(prop)
                } else {
                    /**
                     * otherwise create a new one
                     */
                    isChoice = true
                    valuesOrProperties.push([prop])
                }

                this.nextToken() // eat /
                this.nextToken() // eat /
                continue
            }

            /**
             * else if no colon was found, throw
             */
            if (!this.isPropertyValueSeparator()) {
                throw new Error('Expected ":" or "=>"')
            }

            this.nextToken() // eat :

            /**
             * parse property value
             */
            const props = this.parseAssignmentValue()
            if (Array.isArray(props)) {
                /**
                 * property has multiple types (e.g. `float / tstr / int`)
                 */
                propertyType.push(...props)
            } else {
                propertyType.push(props)
            }

            /**
             * advance comma
             */
            let flipIsChoice = false
            if (this.curToken.Type === Tokens.COMMA) {
                /**
                 * if we are in a choice, we leave it here
                 */
                flipIsChoice = true

                this.nextToken() // eat ,
            }

            comment = this.parseComment()

            const prop = {
                HasCut: hasCut,
                Occurrence: occurrence,
                Name: propertyName,
                Type: propertyType,
                Comment: comment
            }
            if (isChoice) {
                (valuesOrProperties[valuesOrProperties.length - 1] as Property[]).push(prop)
            } else {
                valuesOrProperties.push(prop)
            }

            if (flipIsChoice) {
                isChoice = false
            }

            /**
             * if `}` is found we are at the end of the group
             */
            if (closingTokens.includes(this.curToken.Type)) {
                break
            }

            /**
             * eat // if we are in a choice
             */
            if (isChoice) {
                this.nextToken() // eat /
                this.nextToken() // eat /
                continue
            }
        }

        /**
         * close segment
         */
        while (this.curToken.Type === [...closingTokens].shift()) {
            this.nextToken()
        }

        /**
         * if last closing token is "]" we have an array
         */
        if (closingTokens[closingTokens.length - 1] === Tokens.RBRACK) {
            return {
                Type: 'array',
                Name: groupName || '',
                Values: valuesOrProperties
            }
        }

        /**
         * otherwise a group
         */
        return {
            Type: 'group',
            Name: groupName || '',
            Properties: valuesOrProperties,
            IsChoiceAddition: isChoiceAddition
        }
    }

    private isPropertyValueSeparator () {
        if (this.curToken.Type === Tokens.COLON) {
            return true
        }

        if (this.curToken.Type === Tokens.ASSIGN && this.peekToken.Type === Tokens.GT) {
            this.nextToken() // eat <
            return true
        }

        return false
    }

    /**
     * checks if group segment is opened and forwards to beginning of
     * first property declaration
     * @returns {String[]}  closing tokens for group (either `}`, `)` or both)
     */
    private openSegment (): string[] {
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
        } else if (this.curToken.Type === Tokens.LBRACK) {
            this.nextToken()
            return [Tokens.RBRACK]
        }

        return []
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
        let type: PropertyType
        let isUnwrapped = false

        /**
         * check if variable name is unwrapped
         */
        if (this.curToken.Literal === Tokens.TILDE) {
            isUnwrapped = true
            this.nextToken() // eat ~
        }
        
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
                break
            default: {
                if (BOOLEAN_LITERALS.includes(this.curToken.Literal)) {
                    type = {
                        Type: 'literal' as PropertyReferenceType,
                        Value: this.curToken.Literal === 'true',
                        Unwrapped: isUnwrapped
                    }
                } else if (this.curToken.Type === Tokens.IDENT) {
                    type = {
                        Type: 'group' as PropertyReferenceType,
                        Value: this.curToken.Literal,
                        Unwrapped: isUnwrapped
                    }
                } else if (this.curToken.Type === Tokens.STRING) {
                    type = {
                        Type: 'literal' as PropertyReferenceType,
                        Value: this.curToken.Literal,
                        Unwrapped: isUnwrapped
                    }
                } else if (this.curToken.Type === Tokens.NUMBER || this.curToken.Type === Tokens.FLOAT) {
                    type = {
                        Type: 'literal' as PropertyReferenceType,
                        Value: parseNumberValue(this.curToken),
                        Unwrapped: isUnwrapped
                    }
                } else if (this.curToken.Type === Tokens.HASH) {
                    this.nextToken()
                    const n = parseNumberValue(this.curToken)
                    this.nextToken() // eat numeric value
                    this.nextToken() // eat (
                    const t = this.parsePropertyType()
                    this.nextToken() // eat )
                    type = {
                        Type: 'tag',
                        Value: {
                            NumericPart: n as number,
                            TypePart: t as string
                        },
                        Unwrapped: isUnwrapped
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
                },
                Unwrapped: isUnwrapped
            }
        }

        return type
    }

    private parsePropertyTypes (): PropertyType[] {
        const propertyTypes: PropertyType[] = []

        propertyTypes.push(this.parsePropertyType())
        this.nextToken() // eat `/`

        /**
         * ensure we don't go into the next choice, e.g.:
         * ```
         * delivery = (
         *   city // lala: tstr / bool // per-pickup: true,
         * )
         */
        if (this.curToken.Type === Tokens.SLASH && this.peekToken.Type === Tokens.SLASH) {
            return propertyTypes
        }

        /**
         * capture more if available (e.g. `tstr / float / boolean`)
         */
        while (this.curToken.Type === Tokens.SLASH) {
            this.nextToken() // eat `/`
            propertyTypes.push(this.parsePropertyType())
            this.nextToken()

            /**
             * ensure we don't go into the next choice, e.g.:
             * ```
             * delivery = (
             *   city // lala: tstr / bool // per-pickup: true,
             * )
             */
            if (this.curToken.Type === Tokens.SLASH && this.peekToken.Type === Tokens.SLASH) {
                break
            }
        }

        return propertyTypes
    }

    private parseOccurrences () {
        let occurrence = DEFAULT_OCCURRENCE

        /**
         * check for non-numbered occurrence indicator, e.g.
         * ```
         *  * bedroom: size,
         * ```
         * which is the same as:
         * ```
         *  ? bedroom: size,
         * ```
         * or have miniumum of 1 occurrence
         * ```
         *  + bedroom: size,
         * ```
         */
        if (this.curToken.Type === Tokens.QUEST || this.curToken.Type === Tokens.ASTERISK || this.curToken.Type === Tokens.PLUS) {
            const n = this.curToken.Type === Tokens.PLUS ? 1 : 0
            let m = Infinity

            /**
             * check if there is a max definition
             */
            if (this.peekToken.Type === Tokens.NUMBER) {
                m = parseInt(this.peekToken.Literal, 10)
                this.nextToken()
            }

            occurrence = { n, m }
            this.nextToken()
        /**
         * numbered occurrence indicator, e.g.
         * ```
         *  1*10 bedroom: size,
         * ```
         */
        } else if (
            this.curToken.Type === Tokens.NUMBER &&
            this.peekToken.Type === Tokens.ASTERISK
        ) {
            const n = parseInt(this.curToken.Literal, 10)
            let m = Infinity
            this.nextToken() // eat "n"
            this.nextToken() // eat "*"

            /**
             * check if there is a max definition
             */
            if (this.curToken.Type === Tokens.NUMBER) {
                m = parseInt(this.curToken.Literal, 10)
                this.nextToken()
            }

            occurrence = { n, m }
        }

        return occurrence
    }

    /**
     * check if line has a comment
     */
    private parseComment () {
        let comment = ''
        if (this.curToken.Type === Tokens.COMMENT) {
            comment = this.curToken.Literal.slice(2)
            this.nextToken()
        }

        return comment
    }

    parse () {
        const definition: Assignment[] = []

        while (this.curToken.Type !== Tokens.EOF) {
            if (this.curToken.Type === Tokens.COMMENT) {
                const comment: Comment = {
                    Type: 'comment',
                    Content: this.curToken.Literal.slice(1).trim()
                }
                definition.push(comment)
                this.nextToken()
                continue
            }

            const group = this.parseAssignments()
            if (group) {
                definition.push(group)
            }
        }

        return definition
    }
}