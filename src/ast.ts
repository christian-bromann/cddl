/**
 * a group definition
 * ```
 * person = {
 *     age: int,
 *     name: tstr,
 *     employer: tstr,
 * }
 * ```
 */
export type Group = {
    Type: 'group'
    Name: string
    IsChoiceAddition: boolean
    Properties: (Property|Property[])[]
    Comments: Comment[]
}

/**
 * an array definition
 * ```
 * Geography = [
 *     city: tstr
 * ]
 * ```
 */
export type Array = {
    Type: 'array'
    Name: string
    Values: (Property|Property[])[]
    Comments: Comment[]
}

/**
 * a tag definition
 * ```
 * #6.32(tstr)
 * ```
 */
export type Tag = {
    NumericPart: number
    TypePart: string
}

/**
 * a variable assignment
 * ```
 * device-address = byte
 * ```
 */
export type Variable = {
    Type: 'variable'
    Name: string
    IsChoiceAddition: boolean
    PropertyType: PropertyType | PropertyType[]
    Operator?: Operator
    Comments: Comment[]
}

/**
 * a comment statement
 * ```
 * ; This is a comment
 * ```
 */
export type Comment = {
    Type: 'comment'
    Content: string
    Leading: boolean
}

export type Occurrence = {
    n: number
    m: number
}

export type Property = {
    HasCut: boolean
    Occurrence: Occurrence
    Name: PropertyName
    Type: PropertyType | PropertyType[]
    Comments: Comment[]
    Operator?: Operator
}

export enum Type {
    /**
     * any types
     */
    ANY = 'any',

    /**
     * boolean types
     */
    // Boolean value (major type 7, additional information 20 or 21).
    BOOL = 'bool',

    /**
     * numeric types
     */
    // An unsigned integer or a negative integer.
    INT = 'int',
    // An unsigned integer (major type 0).
    UINT = 'uint',
    // A negative integer (major type 1).
    NINT = 'nint',
    // One of float16, float32, or float64.
    FLOAT = 'float',
    // A number representable as an IEEE 754 half-precision float
    FLOAT16 = 'float16',
    // A number representable as an IEEE 754 single-precision
    FLOAT32 = 'float32',
    // A number representable as an IEEE 754 double-precision
    FLOAT64 = 'float64',

    /**
     * string types
     */
    // A byte string (major type 2).
    BSTR = 'bstr',
    // A byte string (major type 2).
    BYTES = 'bytes',
    // Text string (major type 3)
    TSTR = 'tstr',
    // Text string (major type 3)
    TEXT = 'text',

    /**
     * null types
     */
    NIL = 'nil',
    NULL = 'null'
}

/**
 * can be a number, e.g. "foo = 0..10"
 * ```
 * {
 *   Type: "int",
 *   Value: 6
 * }
 * ```
 * or a literal, e.g. "foo = 0..max-byte"
 * ```
 * {
 *   Type: "literal",
 *   Value: "max-byte"
 * }
 * ```
 */
export type RangePropertyReference = number | string

export type Range = {
    Min: RangePropertyReference
    Max: RangePropertyReference
    Inclusive: boolean
}

export type OperatorType = 'default' | 'size' | 'regexp' | 'bits' | 'and' | 'within' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge'
export interface Operator {
    Type: OperatorType
    Value: PropertyType
}

export type PropertyReferenceType = 'literal' | 'group' | 'group_array' | 'array' | 'range' | 'tag'
export type PropertyReference = {
    Type: PropertyReferenceType
    Value: string | number | boolean | Group | Array | Range | Tag
    Unwrapped: boolean
    Operator?: Operator
}

export interface NativeTypeWithOperator {
    Type: Type | PropertyReference
    Operator?: Operator
}

export type Assignment = Group | Array | Variable
export type PropertyType = Assignment | Array | PropertyReference | string | NativeTypeWithOperator
export type PropertyName = string
