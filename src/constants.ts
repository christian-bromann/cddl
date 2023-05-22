export const WHITESPACE_CHARACTERS = [' ', '\t', '\n', '\r']
export const BOOLEAN_LITERALS = ['true', 'false']

/**
 * as defined in Appendix D
 * https://tools.ietf.org/html/draft-ietf-cbor-cddl-08#appendix-D
 */
export const PREDEFINED_IDENTIFIER = [
    'any', 'uint', 'nint', 'int', 'bstr', 'bytes', 'tstr', 'text',
    'tdate', 'time', 'number', 'biguint', 'bignint', 'bigint',
    'integer', 'unsigned', 'decfrac', 'bigfloat', 'eb64url',
    'eb64legacy', 'eb16', 'encoded-cbor', 'uri', 'b64url',
    'b64legacy', 'regexp', 'mime-message', 'cbor-any', 'float16',
    'float32', 'float64', 'float16-32', 'float32-64', 'float',
    'false', 'true', 'bool', 'nil', 'null', 'undefined'
]
