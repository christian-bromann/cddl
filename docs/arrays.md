# Arrays

Arrays are a core component of CDDL that define ordered collections of elements. This document explains how arrays are represented in the AST.

## Array Definition

In the AST, an array is represented by the following structure:

```typescript
export type Array = {
    Type: 'array'
    Name: string
    Values: (Property|Property[])[]
    Comments: Comment[]
}
```

Where:
- `Type`: Always set to 'array' to identify this node as an array
- `Name`: The name of the array
- `Values`: An array of properties or property choice arrays that define the elements of the array
- `Comments`: An array of comments associated with the array

## Array Elements

The elements of an array are defined by the `Values` field, which contains property definitions. Each property can represent:

1. A named element:
   ```cddl
   [field1: int, field2: text]
   ```

2. An unnamed element:
   ```cddl
   [int, text]
   ```

3. A repeated element with occurrence indicators:
   ```cddl
   [* int]
   ```

4. A choice between multiple elements:
   ```cddl
   [(int // text)]
   ```

## Named Array Example

```cddl
basic-header = [
    field1: int,
    field2: text
]
```

AST representation:

```json
{
  "Type": "array",
  "Name": "basic-header",
  "Values": [
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "field1",
      "Type": ["int"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "field2",
      "Type": ["text"],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Array with Occurrence Indicators

CDDL allows specifying how many times an element can occur using occurrence indicators. The AST represents this using the `Occurrence` field in the Property object.

```cddl
unlimited-people = [* person]
at-least-one-person = [+ person]
zero-or-one-person = [? person]
one-or-two-people = [1*2 person]
zero-or-two-people = [0*2 person]
two-or-infinity-people = [2* person]
```

AST representation for "unlimited-people":

```json
{
  "Type": "array",
  "Name": "unlimited-people",
  "Values": [
    {
      "HasCut": false,
      "Occurrence": { "n": 0, "m": Infinity },
      "Name": "",
      "Type": [
        {
          "Type": "group",
          "Value": "person",
          "Unwrapped": false
        }
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```

AST representation for "one-or-two-people":

```json
{
  "Type": "array",
  "Name": "one-or-two-people",
  "Values": [
    {
      "HasCut": false,
      "Occurrence": { "n": 1, "m": 2 },
      "Name": "",
      "Type": [
        {
          "Type": "group",
          "Value": "person",
          "Unwrapped": false
        }
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Unwrapped Arrays

CDDL allows for unwrapping arrays to include their elements directly in another array. This is represented in the AST with the `Unwrapped` flag set to `true` in the type reference.

```cddl
basic-header = [
    field1: int,
    field2: text
]

advanced-header = [
    ~basic-header,
    field3: bytes,
    field4: ~time
]
```

AST representation for "advanced-header":

```json
{
  "Type": "array",
  "Name": "advanced-header",
  "Values": [
    {
      "HasCut": false,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "",
      "Type": [
        {
          "Type": "group",
          "Value": "basic-header",
          "Unwrapped": true
        }
      ],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "field3",
      "Type": ["bytes"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "field4",
      "Type": [
        {
          "Type": "group",
          "Value": "time",
          "Unwrapped": true
        }
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Nested Arrays

Arrays can be nested to represent more complex structures:

```cddl
script.MappingRemoteValue = [
    * [
        script.RemoteValue / text,
        script.RemoteValue
    ]
]
```

AST representation:

```json
{
  "Type": "array",
  "Name": "script.MappingRemoteValue",
  "Values": [
    {
      "HasCut": false,
      "Occurrence": { "n": 0, "m": Infinity },
      "Name": "",
      "Type": {
        "Type": "array",
        "Name": "",
        "Values": [
          {
            "HasCut": false,
            "Occurrence": { "n": 1, "m": 1 },
            "Name": "",
            "Type": [
              {
                "Type": "group",
                "Value": "script.RemoteValue",
                "Unwrapped": false
              },
              "text"
            ],
            "Comments": []
          },
          {
            "HasCut": false,
            "Occurrence": { "n": 1, "m": 1 },
            "Name": "",
            "Type": [
              {
                "Type": "group",
                "Value": "script.RemoteValue",
                "Unwrapped": false
              }
            ],
            "Comments": []
          }
        ],
        "Comments": []
      },
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Array Element Choices

CDDL allows for choices between different types of elements in an array. In the AST, this is represented by an array of types in the `Type` field of a property.

```cddl
points = [* (int / float)]
```

AST representation:

```json
{
  "Type": "array",
  "Name": "points",
  "Values": [
    {
      "HasCut": false,
      "Occurrence": { "n": 0, "m": Infinity },
      "Name": "",
      "Type": [
        "int",
        "float"
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Using Arrays as Types

Arrays can also be used as types in property definitions:

```cddl
located-samples = {
  sample-point: int,
  samples: [+ float]
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "located-samples",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": false,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "sample-point",
      "Type": ["int"],
      "Comments": []
    },
    {
      "HasCut": false,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "samples",
      "Type": [
        {
          "Type": "array",
          "Name": "",
          "Values": [
            {
              "HasCut": false,
              "Occurrence": { "n": 1, "m": Infinity },
              "Name": "",
              "Type": "float",
              "Comments": []
            }
          ],
          "Comments": []
        }
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```

By understanding these different array representations in the AST, you can properly interpret and process CDDL array definitions for further transformation or analysis.
