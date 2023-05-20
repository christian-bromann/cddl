import camelcase from 'camelcase'
import { parse, print, visit, types } from 'recast'
import typescriptParser from 'recast/parsers/typescript.js'

// @ts-ignore
import pkg from '../../package.json' assert { type: 'json' }
import type { Assignment, PropertyType, PropertyReference, Property, Array, NativeTypeWithOperator, Type, Group } from '../ast'

const b = types.builders
const comments: string[] = []
const NATIVE_TYPES: Record<string, any> = {
    number: b.tsNumberKeyword(),
    float: b.tsNumberKeyword(),
    uint: b.tsNumberKeyword(),
    bool: b.tsBooleanKeyword(),
    str: b.tsStringKeyword(),
    text: b.tsStringKeyword(),
    tstr: b.tsStringKeyword(),
    range: b.tsNumberKeyword()
}
type ObjectBody = (types.namedTypes.TSCallSignatureDeclaration | types.namedTypes.TSConstructSignatureDeclaration | types.namedTypes.TSIndexSignature | types.namedTypes.TSMethodSignature | types.namedTypes.TSPropertySignature)[]

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
    ast.program.comments = comments.map((c) => b.commentLine(c, false, false))

    return print(ast).code
}

function parseAssignment (ast: types.namedTypes.File, assignment: Assignment) {
    if (assignment.Type === 'comment') {
        comments.push(assignment.Content)
        return
    }

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
        expr.comments = comments.map((c) => b.commentLine(c, true))
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
        return expr
    }
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
        const typeParameters = b.tsTypeAnnotation(b.tsUnionType(cddlType.map((t) => {
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

            throw new Error(`Couldn't parse property ${JSON.stringify(t)}`)
        })))
        const isOptional = prop.Occurrence.n === 0
        propItems.push(b.tsPropertySignature(id, typeParameters, isOptional))
    }

    return propItems
}
