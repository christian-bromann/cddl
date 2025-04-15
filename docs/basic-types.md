# Basic Types

The CDDL AST parser defines several basic types that form the building blocks of the Abstract Syntax Tree. This document describes these core types.

## Primitive Types

The parser supports the following primitive types as defined in the CDDL specification:

```typescript
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
```

These types correspond to the CBOR (Concise Binary Object Representation) types as specified in [RFC 7049](https://datatracker.ietf.org/doc/rfc7049/).

## Type References

In the AST, a type reference can be represented in several ways:

1. As a string directly corresponding to one of the primitive types:
   ```typescript
   "Type": "tstr"
   ```

2. As a property reference to another named type:
   ```typescript
   "Type": {
     "Type": "group",
     "Value": "person",
     "Unwrapped": false
   }
   ```

3. As a literal value:
   ```typescript
   "Type": {
     "Type": "literal",
     "Value": "some string",
     "Unwrapped": false
   }
   ```

4. As a range:
   ```typescript
   "Type": {
     "Type": "range",
     "Value": {
       "Min": 0,
       "Max": 255,
       "Inclusive": true
     },
     "Unwrapped": false
   }
   ```

5. As a type with an operator:
   ```typescript
   {
     "Type": "uint",
     "Operator": {
       "Type": "ge",
       "Value": {
         "Type": "literal",
         "Value": 0,
         "Unwrapped": false
       }
     }
   }
   ```

## Type Combinations

Types can be combined in various ways:

1. As an array of alternative types (choices):
   ```typescript
   "Type": [
     "tstr",
     "uint",
     {
       "Type": "literal",
       "Value": "default value",
       "Unwrapped": false
     }
   ]
   ```

2. As complex structures (groups and arrays):
   ```typescript
   "Type": {
     "Type": "group",
     "Name": "address",
     "IsChoiceAddition": false,
     "Properties": [
       // properties...
     ],
     "Comments": []
   }
   ```

## Usage in the AST

These basic types are used throughout the AST to define:

1. The type of a property in a group
2. The possible values of a variable assignment
3. The elements in an array
4. The parameters for operators

Understanding these basic types is essential for working with the AST and properly interpreting its structure.

## Example

Here's an example showing how different types are represented in a CDDL file and its corresponding AST:

```cddl
person = {
  name: tstr,
  age: uint,
  is-active: bool,
  tags: [* tstr],
  status: "active" / "inactive" / "suspended"
}
```

The AST representation for this would include the various types we've discussed:

```json
{
  "Type": "group",
  "Name": "person",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "name",
      "Type": ["tstr"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "age",
      "Type": ["uint"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "is-active",
      "Type": ["bool"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "tags",
      "Type": [{
        "Type": "array",
        "Values": [{
          "HasCut": false,
          "Occurrence": { "n": 0, "m": Infinity },
          "Name": "",
          "Type": ["tstr"],
          "Comments": []
        }]
      }],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "status",
      "Type": [
        {
          "Type": "literal",
          "Value": "active",
          "Unwrapped": false
        },
        {
          "Type": "literal",
          "Value": "inactive",
          "Unwrapped": false
        },
        {
          "Type": "literal",
          "Value": "suspended",
          "Unwrapped": false
        }
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```