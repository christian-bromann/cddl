# Groups

Groups are a fundamental building block of CDDL definitions. They define a collection of properties and are used to represent structured data. This document explains how groups are represented in the AST.

## Group Definition

In the AST, a group is represented by the following structure:

```typescript
export type Group = {
    Type: 'group'
    Name: string
    IsChoiceAddition: boolean
    Properties: (Property|Property[])[]
    Comments: Comment[]
}
```

Where:
- `Type`: Always set to 'group' to identify this node as a group
- `Name`: The name of the group
- `IsChoiceAddition`: A boolean indicating if this group is a choice addition (using the `/=` operator)
- `Properties`: An array of property definitions or property choice arrays
- `Comments`: An array of comments associated with the group

## Group Properties

The properties of a group define its structure. Each property can be one of:

1. A single property definition:
   ```typescript
   Property
   ```

2. An array of property definitions for choices:
   ```typescript
   Property[]
   ```

This allows for representing properties with alternatives.

## Anonymous and Named Groups

Groups can be either named (top-level) or anonymous (inline). Named groups appear as top-level assignments in the AST, while anonymous groups can appear as property types within other groups or arrays.

### Named Group Example

```cddl
person = {
    name: tstr,
    age: uint
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
    }
  ],
  "Comments": []
}
```

### Anonymous Group Example

```cddl
person = {
    name: tstr,
    address: {
        street: tstr,
        city: tstr
    }
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
      "Name": "name",
      "Type": ["tstr"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "address",
      "Type": [{
        "Type": "group",
        "Name": "",
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
      }],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Group Composition

CDDL allows groups to be composed by including another group. This is represented in the AST using a property with an empty name that references the included group.

```cddl
address = {
    street: tstr,
    city: tstr
}

fullAddress = {
    address,
    country: tstr
}
```

AST representation:

```json
[
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
  },
  {
    "Type": "group",
    "Name": "fullAddress",
    "IsChoiceAddition": false,
    "Properties": [
      {
        "HasCut": false,
        "Occurrence": { "n": 1, "m": 1 },
        "Name": "",
        "Type": [{
          "Type": "group",
          "Value": "address",
          "Unwrapped": false
        }],
        "Comments": []
      },
      {
        "HasCut": true,
        "Occurrence": { "n": 1, "m": 1 },
        "Name": "country",
        "Type": ["tstr"],
        "Comments": []
      }
    ],
    "Comments": []
  }
]
```

## Group Choice Additions

CDDL allows extending choices using the `/=` operator. This is represented in the AST with the `IsChoiceAddition` flag set to `true`.

```cddl
delivery = {
  street: tstr,
  number: uint,
  city: city
}

delivery /= {
  lat: float,
  long: float,
  drone-type: tstr
}
```

AST representation:

```json
[
  {
    "Type": "group",
    "Name": "delivery",
    "IsChoiceAddition": false,
    "Properties": [
      {
        "HasCut": true,
        "Name": "street",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": ["tstr"],
        "Comments": []
      },
      {
        "HasCut": true,
        "Name": "number",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": ["uint"],
        "Comments": []
      },
      {
        "HasCut": true,
        "Name": "city",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": [{
          "Type": "group",
          "Value": "city",
          "Unwrapped": false
        }],
        "Comments": []
      }
    ],
    "Comments": []
  },
  {
    "Type": "group",
    "Name": "delivery",
    "IsChoiceAddition": true,
    "Properties": [
      {
        "HasCut": true,
        "Name": "lat",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": ["float"],
        "Comments": []
      },
      {
        "HasCut": true,
        "Name": "long",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": ["float"],
        "Comments": []
      },
      {
        "HasCut": true,
        "Name": "drone-type",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": ["tstr"],
        "Comments": []
      }
    ],
    "Comments": []
  }
]
```

## Property Choices

CDDL allows for choice between properties in a group, represented by the `/` operator. In the AST, this is represented as an array of properties within the `Properties` array.

```cddl
delivery = {
  street: tstr,
  (city: city // po-box: uint)
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "delivery",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": true,
      "Name": "street",
      "Occurrence": { "n": 1, "m": 1 },
      "Type": ["tstr"],
      "Comments": []
    },
    [
      {
        "HasCut": false,
        "Name": "",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": {
          "Type": "group",
          "Value": "city",
          "Unwrapped": false
        },
        "Comments": []
      },
      {
        "HasCut": true,
        "Name": "po-box",
        "Occurrence": { "n": 1, "m": 1 },
        "Type": ["uint"],
        "Comments": []
      }
    ]
  ],
  "Comments": []
}
```

By understanding these different group representations in the AST, you can properly interpret and process CDDL group definitions for further transformation or analysis.
