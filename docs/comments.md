# Comments

Comments are an important part of CDDL files that provide additional context and information about the definitions. This document explains how comments are represented in the AST.

## Comment Definition

In the AST, a comment is represented by the following structure:

```typescript
export type Comment = {
    Type: 'comment'
    Content: string
    Leading: boolean
}
```

Where:
- `Type`: Always set to 'comment' to identify this node as a comment
- `Content`: The text content of the comment (without the comment marker)
- `Leading`: A boolean indicating if this is a leading comment (appears before the definition) or a trailing comment (appears after the definition)

## Comment Syntax

In CDDL, comments are denoted by a semicolon `;` and continue until the end of the line:

```cddl
; This is a comment
person = {
    name: tstr,  ; This is another comment
    age: uint
}
```

## Comment Location in the AST

Comments can be associated with various elements in the AST:

1. Groups
2. Arrays
3. Variables
4. Properties

Each of these elements has a `Comments` field that contains an array of comment objects associated with that element.

## Examples

### Comments on Group Definitions

```cddl
; This is a comment
; foobar
; This is another
; very nice comment
person = {
    ; a good employer
    employer: tstr
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "person",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "employer",
      "Type": ["tstr"],
      "Comments": [
        {
          "Type": "comment",
          "Content": "a good employer",
          "Leading": false
        }
      ]
    }
  ],
  "Comments": [
    {
      "Type": "comment",
      "Content": "This is a comment",
      "Leading": false
    },
    {
      "Type": "comment",
      "Content": "foobar",
      "Leading": false
    },
    {
      "Type": "comment",
      "Content": "This is another",
      "Leading": false
    },
    {
      "Type": "comment",
      "Content": "very nice comment",
      "Leading": false
    }
  ]
}
```

### Comments on Array Elements

```cddl
Geography = [
    ; a city
    city: tstr,
    ; some coordinates
    gpsCoordinates: GpsCoordinates
]
```

AST representation:

```json
{
  "Type": "array",
  "Name": "Geography",
  "Values": [
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "city",
      "Type": ["tstr"],
      "Comments": [
        {
          "Type": "comment",
          "Content": "a city",
          "Leading": false
        }
      ]
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "gpsCoordinates",
      "Type": [{
        "Type": "group",
        "Value": "GpsCoordinates",
        "Unwrapped": false
      }],
      "Comments": [
        {
          "Type": "comment",
          "Content": "some coordinates",
          "Leading": false
        }
      ]
    }
  ],
  "Comments": []
}
```

### Comments on Variable Definitions

```cddl
; unit: m/s
speed = number .ge 0
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "speed",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": {
        "Type": "group",
        "Value": "number",
        "Unwrapped": false
      },
      "Operator": {
        "Type": "ge",
        "Value": {
          "Type": "literal",
          "Value": 0,
          "Unwrapped": false
        }
      }
    }
  ],
  "Comments": [
    {
      "Type": "comment",
      "Content": "unit: m/s",
      "Leading": false
    }
  ]
}
```

### Comments on Properties in Groups

```cddl
GpsCoordinates = {
    ; degrees, scaled by 10^7
    longitude: uint,
    ; degreed, scaled by 10^7
    latitude: uint
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "GpsCoordinates",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "longitude",
      "Type": ["uint"],
      "Comments": [
        {
          "Type": "comment",
          "Content": "degrees, scaled by 10^7",
          "Leading": false
        }
      ]
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "latitude",
      "Type": ["uint"],
      "Comments": [
        {
          "Type": "comment",
          "Content": "degreed, scaled by 10^7",
          "Leading": false
        }
      ]
    }
  ],
  "Comments": []
}
```

### Multiple Comments on an Element

Comments can be stacked together in the CDDL file:

```cddl
; some comment
; another comment
foo = {
    bar
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "foo",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": false,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "",
      "Type": [{
        "Type": "group",
        "Value": "bar",
        "Unwrapped": false
      }],
      "Comments": []
    }
  ],
  "Comments": [
    {
      "Type": "comment",
      "Content": "some comment",
      "Leading": false
    },
    {
      "Type": "comment",
      "Content": "another comment",
      "Leading": false
    }
  ]
}
```

## Working with Comments

When processing the AST, you can use the comments to:

1. Generate documentation from the CDDL file
2. Add explanatory comments to generated code
3. Provide additional context or constraints not directly expressible in CDDL
4. Preserve the original author's intentions and notes

Comments provide valuable metadata about the CDDL definitions and should be preserved when transforming the AST to other formats.
