# Ranges

Ranges in CDDL define a continuous set of values between a minimum and maximum value. This document explains how ranges are represented in the AST.

## Range Definition

In the AST, a range is represented by the following structure:

```typescript
export type Range = {
    Min: RangePropertyReference
    Max: RangePropertyReference
    Inclusive: boolean
}

export type RangePropertyReference = number | string
```

Where:
- `Min`: The minimum value of the range (can be a number or a reference to another value)
- `Max`: The maximum value of the range (can be a number or a reference to another value)
- `Inclusive`: A boolean indicating if the range boundaries are inclusive

## Range Property Reference

The `Min` and `Max` values in a range can be:

1. Direct numeric values:
   ```json
   "Min": 0,
   "Max": 255
   ```

2. References to named values:
   ```json
   "Min": 0,
   "Max": "max-byte"
   ```

## Range Syntax in CDDL

In CDDL, ranges are defined using the `..` operator for inclusive ranges or `...` for exclusive ranges:

```cddl
byte = 0..255
byte1 = 0...first-non-byte
```

## Range with Literal Values

```cddl
byte = 0..255
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "byte",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "range",
      "Value": {
        "Min": 0,
        "Max": 255,
        "Inclusive": true
      },
      "Unwrapped": false
    }
  ],
  "Comments": []
}
```

## Range with References to Named Values

```cddl
max-byte = 255
byte = 0..max-byte
```

AST representation:

```json
[
  {
    "Type": "variable",
    "Name": "max-byte",
    "IsChoiceAddition": false,
    "PropertyType": [
      {
        "Type": "literal",
        "Value": 255,
        "Unwrapped": false
      }
    ],
    "Comments": []
  },
  {
    "Type": "variable",
    "Name": "byte",
    "IsChoiceAddition": false,
    "PropertyType": [
      {
        "Type": "range",
        "Value": {
          "Min": 0,
          "Max": {
            "Type": "group",
            "Value": "max-byte",
            "Unwrapped": false
          },
          "Inclusive": true
        },
        "Unwrapped": false
      }
    ],
    "Comments": []
  }
]
```

## Exclusive Range

```cddl
first-non-byte = 256
byte1 = 0...first-non-byte
```

AST representation:

```json
[
  {
    "Type": "variable",
    "Name": "first-non-byte",
    "IsChoiceAddition": false,
    "PropertyType": [
      {
        "Type": "literal",
        "Value": 256,
        "Unwrapped": false
      }
    ],
    "Comments": []
  },
  {
    "Type": "variable",
    "Name": "byte1",
    "IsChoiceAddition": false,
    "PropertyType": [
      {
        "Type": "range",
        "Value": {
          "Min": 0,
          "Max": {
            "Type": "group",
            "Value": "first-non-byte",
            "Unwrapped": false
          },
          "Inclusive": false
        },
        "Unwrapped": false
      }
    ],
    "Comments": []
  }
]
```

## Range with Floating-Point Values

```cddl
scale = (0.1..2) .default 1
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "scale",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": {
        "Type": "range",
        "Value": {
          "Min": 0.1,
          "Max": 2,
          "Inclusive": true
        },
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

## Large Integer Ranges

CDDL can represent large integer ranges:

```cddl
js-int = -9007199254740991..9007199254740991
```

AST representation:

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

## Using Ranges in Groups and Arrays

Ranges can be used as types within group properties or array elements:

```cddl
port-range = {
  start: 0..65535,
  end: 0..65535
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "port-range",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "start",
      "Type": [
        {
          "Type": "range",
          "Value": {
            "Min": 0,
            "Max": 65535,
            "Inclusive": true
          },
          "Unwrapped": false
        }
      ],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "end",
      "Type": [
        {
          "Type": "range",
          "Value": {
            "Min": 0,
            "Max": 65535,
            "Inclusive": true
          },
          "Unwrapped": false
        }
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Ranges with Operators

Ranges can be used with operators like `.default`:

```cddl
scale = (0.1..2) .default 1
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "scale",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": {
        "Type": "range",
        "Value": {
          "Min": 0.1,
          "Max": 2,
          "Inclusive": true
        },
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

By understanding these range representations in the AST, you can properly interpret and process CDDL range definitions for further transformation or analysis.
