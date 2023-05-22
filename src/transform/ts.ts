import camelcase from 'camelcase'
import { parse, print, types } from 'recast'
import typescriptParser from 'recast/parsers/typescript.js'

// @ts-ignore
import pkg from '../../package.json' assert { type: 'json' }
import type { Assignment, PropertyType, PropertyReference, Property, Array, NativeTypeWithOperator, Type, Group, Operator } from '../ast'

const b = types.builders
const NATIVE_TYPES: Record<string, any> = {
    number: b.tsNumberKeyword(),
    float: b.tsNumberKeyword(),
    uint: b.tsNumberKeyword(),
    bool: b.tsBooleanKeyword(),
    str: b.tsStringKeyword(),
    text: b.tsStringKeyword(),
    tstr: b.tsStringKeyword(),
    range: b.tsNumberKeyword(),
    nil: b.tsNullKeyword(),
    null: b.tsNullKeyword()
}
type ObjectEntry = types.namedTypes.TSCallSignatureDeclaration | types.namedTypes.TSConstructSignatureDeclaration | types.namedTypes.TSIndexSignature | types.namedTypes.TSMethodSignature | types.namedTypes.TSPropertySignature
type ObjectBody = ObjectEntry[]
type TSTypeKind = types.namedTypes.TSAsExpression['typeAnnotation']

export function transform (assignments: Assignment[]) {
    let ast = parse(
        `// compiled with https://www.npmjs.com/package/cddl v${pkg.version}`,
        {
            parser: typescriptParser,
            sourceFileName: 'cddl2Ts.ts',
            sourceRoot: process.cwd()
        }
    ) as types.namedTypes.File

    for (const assignment of assignments) {
        const statement = parseAssignment(ast, assignment)
        if (!statement) {
            continue
        }
        ast.program.body.push(statement)
    }
    return print(ast).code
}

function parseAssignment (ast: types.namedTypes.File, assignment: Assignment) {
    if (assignment.Type === 'variable') {
        const propType = Array.isArray(assignment.PropertyType)
            ? assignment.PropertyType
            : [assignment.PropertyType]

        const id = b.identifier(camelcase(assignment.Name, { pascalCase: true }))

        let typeParameters: any
        // @ts-expect-error e.g. "js-int = -9007199254740991..9007199254740991"
        if (propType.length === 1 && propType[0].Type === 'range') {
            typeParameters = b.tsNumberKeyword()
        } else {
            typeParameters = b.tsUnionType(propType.map(parsePropertyType))
        }

        const expr = b.tsTypeAliasDeclaration(id, typeParameters)
        expr.comments = assignment.Comments.map((c) => b.commentLine(` ${c.Content}`, true))
        return expr
    }

    if (assignment.Type === 'group') {
        const id = b.identifier(camelcase(assignment.Name, { pascalCase: true }))
        const objectType = parseObjectType(assignment.Properties as any)
        const extendInterfaces = (assignment.Properties as Property[])
            .filter((prop: Property) => prop.Name === '')
            .map((prop: Property) => b.tsExpressionWithTypeArguments(
                b.identifier(
                    camelcase(((prop.Type as PropertyType[])[0] as PropertyReference).Value as string, { pascalCase: true }))
                )
            )
        const expr = b.tsInterfaceDeclaration(id, b.tsInterfaceBody(objectType))
        expr.extends = extendInterfaces
        expr.comments = assignment.Comments.map((c) => b.commentLine(` ${c.Content}`, true))
        return expr
    }

    if (assignment.Type === 'array') {
        const id = b.identifier(camelcase(assignment.Name, { pascalCase: true }))
        const firstType = ((assignment.Values[0] as Property).Type as PropertyType[])
        const obj = Array.isArray(firstType)
            ? firstType.map(parseUnionType)
            : (firstType as any).Values
                ? (firstType as any).Values.map((val: any) => parseUnionType(val.Type[0]))
                // ToDo(Christian): transpile this case correctly
                : []
        const value = b.tsArrayType(b.tsParenthesizedType(b.tsUnionType(obj)))
        const expr = b.tsTypeAliasDeclaration(id, value)
        expr.comments = assignment.Comments.map((c) => b.commentLine(` ${c.Content}`, true))
        return expr
    }

    throw new Error(`Unknown assignment type "${(assignment as any).Type}"`)
}

function parsePropertyType (propType: PropertyType) {
    if (typeof propType === 'string') {
        return b.tsStringKeyword()
    }
    if ((propType as PropertyReference).Type === 'group') {
        return b.tsTypeReference(
            b.identifier(
                camelcase((propType as PropertyReference).Value.toString(), { pascalCase: true })
            )
        )
    }
    if ((propType as PropertyReference).Type === 'literal') {
        return b.tsLiteralType(
            b.stringLiteral((propType as PropertyReference).Value.toString())
        )
    }

    throw new Error(`Couldn't parse property type ${JSON.stringify(propType, null, 4)}`)
}

function parseObjectType (props: Property[]): ObjectBody {
    const propItems: ObjectBody = []
    for (const prop of props) {
        /**
         * Empty groups like
         * {
         *   HasCut: false,
         *   Occurrence: { n: 1, m: 1 },
         *   Name: '',
         *   Type: [ { Type: 'group', Value: 'Extensible', Unwrapped: false } ],
         *   Comment: ''
         * }
         * are ignored and later added as interface extensions
         */
        if (prop.Name === '') {
            continue
        }

        const id = b.identifier(camelcase(prop.Name))
        const cddlType: PropertyType[] = Array.isArray(prop.Type) ? prop.Type : [prop.Type]
        const comments: string[] = prop.Comments.map((c) => ` ${c.Content}`)

        if (prop.Operator && prop.Operator.Type === 'default') {
            const defaultValue = parseDefaultValue(prop.Operator)
            defaultValue && comments.length && comments.push('') // add empty line if we have previous comments
            defaultValue && comments.push(` @default ${defaultValue}`)
        }

        const type = cddlType.map((t) => {
            const unionType = parseUnionType(t)
            if (unionType) {
                const defaultValue = parseDefaultValue((t as PropertyReference).Operator)
                defaultValue && comments.length && comments.push('') // add empty line if we have previous comments
                defaultValue && comments.push(` @default ${defaultValue}`)
                return unionType
            }


            throw new Error(`Couldn't parse property ${JSON.stringify(t)}`)
        })

        const typeAnnotation = b.tsTypeAnnotation(b.tsUnionType(type))
        const isOptional = prop.Occurrence.n === 0
        const propSignature = b.tsPropertySignature(id, typeAnnotation, isOptional)
        propSignature.comments = comments.length ? [b.commentBlock(`*\n *${comments.join('\n *')}\n `)] : []
        propItems.push(propSignature)
    }

    return propItems
}

function parseUnionType (t: PropertyType | Assignment): TSTypeKind {
    if (typeof t === 'string') {
        if (!NATIVE_TYPES[t]) {
            throw new Error(`Unknown native type: "${t}`)
        }
        return NATIVE_TYPES[t]
    } else if (NATIVE_TYPES[(t as NativeTypeWithOperator).Type as Type]) {
        return NATIVE_TYPES[(t as NativeTypeWithOperator).Type as Type]
    } else if ((t as PropertyReference).Value === 'null') {
        return b.tsNullKeyword()
    } else if (t.Type === 'group') {
        const value = (t as PropertyReference).Value as string
        /**
         * check if we have
         * ?attributes: {*text => text},
         */
        if (!value && (t as Group).Properties) {
            return b.tsTypeLiteral(parseObjectType((t as Group).Properties as Property[]))
        }

        return b.tsTypeReference(
            b.identifier(camelcase(value.toString(), { pascalCase: true }))
        )
    } else if (t.Type === 'literal' && typeof t.Value === 'string') {
        return b.tsLiteralType(b.stringLiteral(t.Value))
    } else if (t.Type === 'literal' && typeof t.Value === 'number') {
        return b.tsLiteralType(b.numericLiteral(t.Value))
    } else if (t.Type === 'array') {
        const types = ((t as Array).Values[0] as Property).Type as PropertyType[]
        const typedTypes = (Array.isArray(types) ? types : [types]).map((val) => {
            return typeof val === 'string' && NATIVE_TYPES[val]
                ? NATIVE_TYPES[val]
                : b.tsTypeReference(
                    b.identifier(camelcase((val as any).Value as string, { pascalCase: true }))
                )
        })

        return b.tsArrayType(typedTypes.length > 1
            ? b.tsParenthesizedType(b.tsUnionType(typedTypes))
            : b.tsUnionType(typedTypes))
    } else if (typeof t.Type === 'object' && ((t as NativeTypeWithOperator).Type as PropertyReference).Type === 'range') {
        return b.tsNumberKeyword()
    } else if (typeof t.Type === 'object' && ((t as NativeTypeWithOperator).Type as PropertyReference).Type === 'group') {
        /**
         * e.g. ?pointerType: input.PointerType .default "mouse"
         */
        const referenceValue = camelcase(((t as NativeTypeWithOperator).Type as PropertyReference).Value as string, { pascalCase: true })
        return b.tsTypeReference(b.identifier(referenceValue))
    }

    throw new Error(`Unknown union type: ${JSON.stringify(t)}`)
}

function parseDefaultValue (operator?: Operator) {
    if (!operator || operator.Type !== 'default') {
        return
    }

    const operatorValue = operator.Value as PropertyReference
    if (operator.Value === 'null') {
        return operator.Value
    }

    if (operatorValue.Type !== 'literal') {
        throw new Error(`Can't parse operator default value of ${JSON.stringify(operator)}`)
    }
    return typeof operatorValue.Value === 'string'
        ? `'${operatorValue.Value}'`
        : operatorValue.Value as unknown as string
}
