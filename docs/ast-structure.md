# AST Structure

The CDDL parser generates an Abstract Syntax Tree (AST) that represents the structure and semantics of a CDDL document. This document provides an overview of the AST structure.

## Root Structure

The root of the AST is an array of `Assignment` nodes, which can be one of:

- `Group` - Defines a group of properties
- `Array` - Defines an array of values
- `Variable` - Defines a variable assignment

```typescript
// The type hierarchy of the AST root
export type Assignment = Group | Array | Variable
```

## Core Components

The AST is composed of several core types that represent different CDDL constructs:

### Assignments

Assignments are the top-level nodes in the AST. They represent named definitions in CDDL.

```typescript
// Example AST for a group assignment:
{
  "Type": "group",
  "Name": "person",
  "IsChoiceAddition": false,
  "Properties": [
    // Properties...
  ],
  "Comments": []
}
```

### Properties

Properties define members of groups or elements of arrays.

```typescript
export type Property = {
    HasCut: boolean               // Whether the property has a "cut" marker (/)
    Occurrence: Occurrence        // How many times the property can occur
    Name: PropertyName            // The name of the property (string)
    Type: PropertyType | PropertyType[] // The type(s) of the property
    Comments: Comment[]           // Comments attached to the property
    Operator?: Operator           // Optional operator modifying the property
}
```

### Types

Types define the allowed values for properties and variables. They can be:

- Primitive types (int, uint, tstr, etc.)
- References to groups or other types
- Literals (specific values)
- Complex types (like ranges, choices, etc.)

```typescript
export type PropertyType = Assignment | Array | PropertyReference | string | NativeTypeWithOperator
```

## Relationships Between Components

The AST forms a tree structure where:

1. The root consists of assignments
2. Assignments contain properties or type definitions
3. Properties reference types
4. Types can reference other assignments

This hierarchical structure allows the AST to represent complex CDDL documents with nested definitions, references, and type relationships.

## Example AST

Here's a simplified example of an AST for a basic CDDL definition:

```cddl
person = {
  name: tstr,
  age: uint,
  addresses: [* address],
}

address = {
  street: tstr,
  city: tstr,
}
```

Would generate an AST like:

```json
[
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
        "Name": "addresses",
        "Type": [{
          "Type": "array",
          "Values": [{
            "HasCut": false,
            "Occurrence": { "n": 0, "m": Infinity },
            "Name": "",
            "Type": [{
              "Type": "group",
              "Value": "address",
              "Unwrapped": false
            }],
            "Comments": []
          }]
        }],
        "Comments": []
      }
    ],
    "Comments": []
  },
  {
    "Type": "group",
    "Name": "address",
    "IsChoiceAddition": false,
    "Properties": [
      {
        "HasCut": true,
        "Occurrence": { "n": 1, "m": 1 },
        "Name": "street",
        "Type": ["tstr"],
        "Comments": []
      },
      {
        "HasCut": true,
        "Occurrence": { "n": 1, "m": 1 },
        "Name": "city",
        "Type": ["tstr"],
        "Comments": []
      }
    ],
    "Comments": []
  }
]
```

See the other documentation files for details on each component of the AST.
