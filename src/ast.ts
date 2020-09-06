export type Group = {
    GroupName: string;
    Properties: Property[];
}

export type Property = {
    Optional: boolean;
    Name: PropertyName;
    Type: PropertyType;
    Comment: string;
}

export enum Type {
    /**
     * boolean types
     */
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
    TEXT = 'text'
}

export type PropertyType = Group | string
export type PropertyName = string
