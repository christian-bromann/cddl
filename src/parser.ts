import fs from 'node:fs'

import Lexer from './lexer.js'
import { Property } from './ast.js'
import { Token, Tokens } from './tokens.js';
import { PREDEFINED_IDENTIFIER, BOOLEAN_LITERALS } from './constants.js'
import { parseNumberValue } from './utils.js'
import {
    Type, PropertyName, PropertyType, PropertyReferenceType,
    Variable, RangePropertyReference, Occurrence, Assignment,
    Comment, Group, OperatorType, NativeTypeWithOperator, Operator
} from './ast.js'

const NIL_TOKEN: Token = { Type: Tokens.ILLEGAL, Literal: '' }
const DEFAULT_OCCURRENCE: Occurrence = { n: 1, m: 1 } // exactly one time
const OPERATORS: OperatorType[] = ['default', 'size', 'regexp', 'bits', 'and', 'within', 'eq', 'ne', 'lt', 'le', 'gt', 'ge']
const OPERATORS_EXPECTING_VALUES: Record<OperatorType, PropertyReferenceType[] | undefined> = {
    default: undefined,
    size: ['literal', 'range'],
    regexp: ['literal'],
    bits: ['group'],
    and: ['group'],
    within: ['group'],
    eq: ['group'],
    ne: ['group'],
    lt: ['group'],
    le: ['group'],
    gt: ['group'],
    ge: ['group'],
}

export default class Parser {
    #filePath: string
    l: Lexer;

    curToken: Token = NIL_TOKEN;
    peekToken: Token = NIL_TOKEN;

    constructor (filePath: string) {
        this.#filePath = filePath
        this.l = new Lexer(fs.readFileSync(filePath, 'utf-8'))

        this.nextToken()
        this.nextToken()
    }

    private nextToken () {
        this.curToken = this.peekToken
        this.peekToken = this.l.nextToken()
        return true
    }

    private parseAssignments (): Assignment {
        const comments: Comment[] = []
        while (this.curToken.Type === Tokens.COMMENT) {
            comments.push(this.parseComment()!)
        }

        /**
         * expect group identifier, e.g.
         * groupName =
         * groupName /=
         * groupName //=
         */
        if (this.curToken.Type !== Tokens.IDENT || !(this.peekToken.Type === Tokens.ASSIGN || this.peekToken.Type === Tokens.SLASH)) {
            throw this.parserError(`group identifier expected, received "${JSON.stringify(this.curToken)}"`)
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
        const assignmentValue = this.parseAssignmentValue(groupName, isChoiceAddition) as Assignment

        // @ts-expect-error curToken can be changed by now but TS doesn't understand this
        while (this.curToken.Type === Tokens.COMMENT) {
            const comment = this.parseComment()
            comment && comments.push(comment)
        }
        assignmentValue.Comments = comments
        return assignmentValue
    }

    private parseAssignmentValue (groupName?: string, isChoiceAddition = false): Assignment | PropertyType[] {
        let isChoice = false
        const valuesOrProperties: (Property | Property[])[] = []
        const closingTokens = this.openSegment()

        /**
         * if no group segment was opened we have a variable assignment
         * and can return immediatelly, e.g.
         *
         *   attire = "bow tie" / "necktie" / "Internet attire"
         *
         */
        if (closingTokens.length === 0) {
            if (groupName) {
                const variable: Variable = {
                    Type: 'variable',
                    Name: groupName,
                    IsChoiceAddition: isChoiceAddition,
                    PropertyType: this.parsePropertyTypes(),
                    Comments: []
                }

                return variable
            }

            return this.parsePropertyTypes()
        }

        /**
         * type or group choices can be wrapped within `(` and `)`, e.g.
         *
         *   attireBlock = (
         *       "bow tie" /
         *       "necktie" /
         *       "Internet attire"
         *   )
         *   attireGroup = (
         *       attire //
         *       attireBlock
         *   )
         */
        if (closingTokens.length && this.peekToken.Type === Tokens.SLASH) {
            const propertyType: PropertyType[] = []
            while (!closingTokens.includes(this.curToken.Type)) {
                propertyType.push(...this.parsePropertyTypes())
                if (this.curToken.Type === Tokens.RPAREN) {
                    this.nextToken()
                    break
                }

                this.nextToken()

                if (this.curToken.Type === Tokens.SLASH) {
                    this.nextToken()
                }
            }

            if (groupName) {
                const variable: Variable = {
                    Type: 'variable',
                    Name: groupName,
                    IsChoiceAddition: isChoiceAddition,
                    PropertyType: propertyType,
                    Comments: []
                }

                if (this.isOperator()) {
                    variable.Operator = this.parseOperator()
                }

                return variable
            }

            return propertyType
        }

        /**
         * parse operator assignments, e.g. `ip4 = (float .ge 0.0) .default 1.0`
         */
        if (closingTokens.length === 1 && this.peekToken.Type === Tokens.DOT) {
            const prop: PropertyType = {
                Type: this.parsePropertyType(),
                Operator: this.parseOperator()
            } as NativeTypeWithOperator

            this.nextToken() // eat closing token
            if (groupName) {
                const variable: Variable = {
                    Type: 'variable',
                    Name: groupName,
                    IsChoiceAddition: isChoiceAddition,
                    PropertyType: prop,
                    Operator: this.parseOperator(),
                    Comments: []
                }

                return variable
            }

            return [prop]
        }

        while (!closingTokens.includes(this.curToken.Type)) {
            const propertyType: PropertyType[] = []
            const comments: Comment[] = []
            let isUnwrapped = false
            let hasCut = false
            let propertyName = ''

            const leadingComment = this.parseComment(true)
            leadingComment && comments.push(leadingComment)

            const occurrence = this.parseOccurrences()

            /**
             * check if variable name is unwrapped
             */
            if (this.curToken.Literal === Tokens.TILDE) {
                isUnwrapped = true
                this.nextToken() // eat ~
            }

            /**
             * parse assignment within array, e.g.
             * ```
             * ActionsPerformActionsParameters = [1* {
             *   type: "key",
             *   id: text,
             *   actions: ActionItems,
             *   *text => any
             * }]
             * ```
             * or
             * ```
             * script.MappingRemoteValue = [*[(script.RemoteValue / text), script.RemoteValue]];
             * ```
             */
            if (
                this.curToken.Literal === Tokens.LBRACE ||
                this.curToken.Literal === Tokens.LBRACK ||
                this.curToken.Literal === Tokens.LPAREN
            ) {
                const innerGroup = this.parseAssignmentValue() as Group
                valuesOrProperties.push({
                    HasCut: false,
                    Occurrence: occurrence,
                    Name: '',
                    Type: innerGroup,
                    Comments: []
                })
                continue
            }

            /**
             * check if we are in an array and a new item is indicated
             */
            if (this.curToken.Literal === Tokens.COMMA && closingTokens[0] === Tokens.RBRACK) {
                this.nextToken()
                continue
            }

            propertyName = this.parsePropertyName()

            /**
             * if `,` is found we have a group reference and jump to the next line
             */
            if (this.curToken.Type === Tokens.COMMA || closingTokens.includes(this.curToken.Type)) {
                const tokenType = this.curToken.Type
                let parsedComments = false
                let comment: Comment | undefined

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
                    Comments: comment ? [comment] : []
                })

                if (this.curToken.Literal === Tokens.COMMA || this.curToken.Literal === closingTokens[0]) {
                    if (this.curToken.Literal === Tokens.COMMA) {
                        this.nextToken()
                    }
                    continue
                }

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
             * check if we have a group choice instead of an assignment
             */
            if (this.curToken.Type === Tokens.SLASH && this.peekToken.Type === Tokens.SLASH) {
                const prop: Property = {
                    HasCut: hasCut,
                    Occurrence: occurrence,
                    Name: '',
                    Type: {
                        Type: 'group',
                        Value: propertyName,
                        Unwrapped: isUnwrapped
                    },
                    Comments: comments
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
                throw this.parserError('Expected ":" or "=>"')
            }

            this.nextToken() // eat :

            /**
             * parse property value
             */
            const props = this.parseAssignmentValue()
            const operator = this.isOperator() ? this.parseOperator() : undefined
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

            const trailingComment = this.parseComment()
            trailingComment && comments.push(trailingComment)

            const prop = {
                HasCut: hasCut,
                Occurrence: occurrence,
                Name: propertyName,
                Type: propertyType,
                Comments: comments,
                ...(operator ? { Operator: operator } : {})
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
        if (this.curToken.Type === [...closingTokens].shift()) {
            this.nextToken()
        }

        /**
         * if last closing token is "]" we have an array
         */
        if (closingTokens[closingTokens.length - 1] === Tokens.RBRACK) {
            return {
                Type: 'array',
                Name: groupName || '',
                Values: valuesOrProperties,
                Comments: []
            }
        }

        /**
         * simplify wrapped types, e.g. from
         * {
         *     "Type": "group",
         *     "Name": "",
         *     "Properties": [
         *         {
         *             "HasCut": false,
         *             "Occurrence": {
         *                 "n": 1,
         *                 "m": 1
         *             },
         *             "Name": "",
         *             "Type": "bool",
         *             "Comment": ""
         *         }
         *     ],
         *     "IsChoiceAddition": false
         * }
         * back to:
         * bool
         */
        if (!groupName && valuesOrProperties.length === 1 && PREDEFINED_IDENTIFIER.includes((valuesOrProperties[0] as Property).Type as string)) {
            return (valuesOrProperties[0] as Property).Type as Assignment
        }

        /**
         * otherwise a group
         */
        return {
            Type: 'group',
            Name: groupName || '',
            Properties: valuesOrProperties,
            IsChoiceAddition: isChoiceAddition,
            Comments: []
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

        throw this.parserError(`Expected property name, received ${this.curToken.Type}(${this.curToken.Literal}), ${this.peekToken.Type}(${this.peekToken.Literal})`)
    }

    private parsePropertyType (): PropertyType {
        let type: PropertyType | undefined = undefined
        let isUnwrapped = false
        let isGroupedRange = false

        /**
         * check if variable name is unwrapped
         */
        if (this.curToken.Literal === Tokens.TILDE) {
            isUnwrapped = true
            this.nextToken() // eat ~
        }

        switch (this.curToken.Literal) {
            case Type.ANY:
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
            case Type.NIL:
            case Type.NULL:
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
                } else if (this.curToken.Literal === Tokens.LPAREN && this.peekToken.Type === Tokens.NUMBER) {
                    this.nextToken()
                    type = {
                        Type: 'literal' as PropertyReferenceType,
                        Value: parseNumberValue(this.curToken),
                        Unwrapped: isUnwrapped
                    }
                    isGroupedRange = true
                } else {
                    throw this.parserError(`Invalid property type "${this.curToken.Literal}"`)
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
            const Min: RangePropertyReference = typeof type === 'string' || typeof type.Value === 'number'
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

            if (isGroupedRange) {
                this.nextToken() // eat ")"
            }
        }

        return type
    }

    private parseOperator (): Operator {
        const type = this.peekToken.Literal as OperatorType
        if (this.curToken.Literal !== Tokens.DOT || !OPERATORS.includes(this.peekToken.Literal as OperatorType)) {
            throw new Error(`Operator ".${type}", expects a ${OPERATORS_EXPECTING_VALUES[type]!.join(' or ')} property, but found ${this.peekToken.Literal}!`)
        }

        this.nextToken() // eat "."
        this.nextToken() // eat operator type
        const value = this.parsePropertyType() as PropertyReferenceType
        this.nextToken() // eat operator value
        return {
            Type: type,
            Value: value
        }
    }

    private isOperator () {
        return this.curToken.Literal === Tokens.DOT && OPERATORS.includes(this.peekToken.Literal as OperatorType)
    }

    private parsePropertyTypes (): PropertyType[] {
        const propertyTypes: PropertyType[] = []

        let prop: PropertyType = this.parsePropertyType()
        if (this.isOperator()) {
            prop = {
                Type: prop,
                Operator: this.parseOperator()
            } as NativeTypeWithOperator
        } else {
            this.nextToken() // eat `/`
        }

        propertyTypes.push(prop)

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
    private parseComment (isLeading?: boolean): Comment | undefined {
        if (this.curToken.Type !== Tokens.COMMENT) {
            return
        }
        const comment = this.curToken.Literal.replace(/^;(\s*)/, '')
        this.nextToken()

        if (comment.trim().length === 0) {
            return
        }

        return { Type: 'comment', Content: comment, Leading: Boolean(isLeading) }
    }

    parse () {
        const definition: Assignment[] = []

        while (this.curToken.Type !== Tokens.EOF) {
            const group = this.parseAssignments()
            if (group) {
                definition.push(group)
            }
        }

        return definition
    }

    private parserError (message: string) {
        const location = this.l.getLocation()
        const locInfo = this.l.getLocationInfo()
        return new Error(`${this.#filePath.replace(process.cwd(), '')}:${location.line + 1}:${location.position} - error: ${message}\n\n${locInfo}`)
    }
}
