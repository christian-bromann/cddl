import { parse, print, visit, types } from 'recast'
import typescriptParser from 'recast/parsers/typescript.js'

// @ts-ignore
import pkg from '../../package.json' assert { type: 'json' }
import type { Assignment, PropertyType, PropertyReference } from '../ast'

const b = types.builders
let comments: string[] = []

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
    console.log(JSON.stringify(assignment, null, 4));
    
    if (assignment.Type === 'comment') {
        comments.push(assignment.Content)
        return
    }
    
    if (assignment.Type === 'variable') {
        const propType = Array.isArray(assignment.PropertyType)
            ? assignment.PropertyType
            : [assignment.PropertyType]

        const id = b.identifier(assignment.Name)
        const typeParameters = b.tsUnionType(propType.map(parsePropertyType))
        const expr = b.tsTypeAliasDeclaration(id, typeParameters)
        expr.comments = comments.map((c) => b.commentLine(c, true))
        comments = [] as string[]
        return expr
    }
}

function parsePropertyType (propType: PropertyType) {
    if ((propType as PropertyReference).Type === 'group') {
        return b.tsTypeReference(b.identifier((propType as PropertyReference).Value.toString()))
    }
    if ((propType as PropertyReference).Type === 'literal') {
        return b.tsLiteralType(b.stringLiteral((propType as PropertyReference).Value.toString()))
    }

    throw new Error(`Couldn't parse property type ${JSON.stringify(propType, null, 4)}`)
}