# Variables

Variables in CDDL are assignments that associate a name with a type or a choice of types. This document explains how variables are represented in the AST.

## Variable Definition

In the AST, a variable is represented by the following structure:

```typescript
export type Variable = {
    Type: 'variable'
    Name: string
    IsChoiceAddition: boolean
    PropertyType: PropertyType | PropertyType[]
    Operator?: Operator
    Comments: Comment[]
}
```

Where:
- `Type`: Always set to 'variable' to identify this node as a variable
- `Name`: The name of the variable
- `IsChoiceAddition`: A boolean indicating if this variable is a choice addition (using the `/=` operator)
- `PropertyType`: The type or array of types assigned to the variable
- `Operator`: An optional operator that modifies the variable's type
- `Comments`: An array of comments associated with the variable

## Basic Variable Assignments

The simplest form of variable assignment associates a name with a single type:

```cddl
device-address = byte
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "device-address",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "group",
      "Value": "byte",
      "Unwrapped": false
    }
  ],
  "Comments": []
}
```

## Variable with Multiple Type Choices

Variables can be assigned multiple type options using the choice operator (`/`):

```cddl
attire = "bow tie" / "necktie" / "Internet attire"
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "attire",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "literal",
      "Value": "bow tie",
      "Unwrapped": false
    },
    {
      "Type": "literal",
      "Value": "necktie",
      "Unwrapped": false
    },
    {
      "Type": "literal",
      "Value": "Internet attire",
      "Unwrapped": false
    }
  ],
  "Comments": []
}
```

## Variable with Numeric Literals

Variables can be assigned numeric literals:

```cddl
protocol = 6 / 17
js-int = -9007199254740991..9007199254740991
```

AST representation for "protocol":

```json
{
  "Type": "variable",
  "Name": "protocol",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "literal",
      "Value": 6,
      "Unwrapped": false
    },
    {
      "Type": "literal",
      "Value": 17,
      "Unwrapped": false
    }
  ],
  "Comments": []
}
```

AST representation for "js-int" (using range):

```json
{
  "Type": "variable",
  "Name": "js-int",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "range",
      "Value": {
        "Min": -9007199254740991,
        "Max": 9007199254740991,
        "Inclusive": true
      },
      "Unwrapped": false
    }
  ],
  "Comments": []
}
```

## Variable with Operators

Variables can be modified with operators that constrain or transform their values:

```cddl
ip4 = bstr .size 4
nai = tstr .regexp "[A-Za-z0-9]+@[A-Za-z0-9]+(\.[A-Za-z0-9]+)+"
speed = number .ge 0
displayed-step = number .default 1
```

AST representation for "ip4":

```json
{
  "Type": "variable",
  "Name": "ip4",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "bstr",
      "Operator": {
        "Type": "size",
        "Value": {
          "Type": "literal",
          "Value": 4,
          "Unwrapped": false
        }
      }
    }
  ],
  "Comments": []
}
```

AST representation for "speed":

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
  "Comments": []
}
```

AST representation for "displayed-step":

```json
{
  "Type": "variable",
  "Name": "displayed-step",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": {
        "Type": "group",
        "Value": "number",
        "Unwrapped": false
      },
      "Operator": {
        "Type": "default",
        "Value": {
          "Type": "literal",
          "Value": 1,
          "Unwrapped": false
        }
      }
    }
  ],
  "Comments": []
}
```

## Variable Choice Additions

CDDL allows extending variable choices using the `/=` operator. This is represented in the AST with the `IsChoiceAddition` flag set to `true`.

```cddl
attire = "bow tie" / "necktie" / "Internet attire"
attire /= "swimwear"
```

AST representation for the addition:

```json
{
  "Type": "variable",
  "Name": "attire",
  "IsChoiceAddition": true,
  "PropertyType": [
    {
      "Type": "literal",
      "Value": "swimwear",
      "Unwrapped": false
    }
  ],
  "Comments": []
}
```

## Variables with Comments

Comments can be associated with variable definitions:

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

## Variables with CBOR Tags

CDDL allows specifying CBOR tags for variables. In the AST, this is represented using the `tag` type:

```cddl
my_uri = #6.32(tstr) / tstr
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "my_uri",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "tag",
      "Value": {
        "NumericPart": 6.32,
        "TypePart": "tstr"
      },
      "Unwrapped": false
    },
    "tstr"
  ],
  "Comments": []
}
```

By understanding these different variable representations in the AST, you can properly interpret and process CDDL variable definitions for further transformation or analysis.
