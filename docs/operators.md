# Operators

Operators in CDDL modify or constrain types, providing additional semantics beyond basic type definitions. This document explains how operators are represented in the AST.

## Operator Definition

In the AST, an operator is represented by the following structure:

```typescript
export type OperatorType = 'default' | 'size' | 'regexp' | 'bits' | 'and' | 'within' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge'

export interface Operator {
    Type: OperatorType
    Value: PropertyType
}
```

Where:
- `Type`: The type of operator
- `Value`: The value or constraint applied by the operator

## Operator Types

CDDL supports the following operators, represented in the AST:

1. `default`: Specifies a default value for a type
2. `size`: Constrains the size of a value (e.g., for strings or arrays)
3. `regexp`: Specifies a regular expression pattern for strings
4. `bits`: Specifies a bit mask for integers
5. `and`: Logical AND operation between types
6. `within`: Specifies that a value must be within another value
7. `eq`: Equality comparison
8. `ne`: Inequality comparison
9. `lt`: Less than comparison
10. `le`: Less than or equal comparison
11. `gt`: Greater than comparison
12. `ge`: Greater than or equal comparison

## Operator Location in the AST

Operators can be attached to:

1. Variables:
   ```json
   {
     "Type": "variable",
     "Name": "ip4",
     "PropertyType": [{
       "Type": "bstr",
       "Operator": {
         "Type": "size",
         "Value": {
           "Type": "literal",
           "Value": 4,
           "Unwrapped": false
         }
       }
     }]
   }
   ```

2. Properties:
   ```json
   {
     "HasCut": true,
     "Name": "orientation",
     "Type": [
       {
         "Type": "literal",
         "Value": "portrait",
         "Unwrapped": false
       },
       {
         "Type": "literal",
         "Value": "landscape",
         "Unwrapped": false
       }
     ],
     "Operator": {
       "Type": "default",
       "Value": {
         "Type": "literal",
         "Value": "portrait",
         "Unwrapped": false
       }
     }
   }
   ```

3. Types within properties:
   ```json
   {
     "HasCut": true,
     "Name": "optional",
     "Type": [
       {
         "Type": "tstr",
         "Operator": {
           "Type": "default",
           "Value": {
             "Type": "literal",
             "Value": "foobar",
             "Unwrapped": false
           }
         }
       }
     ]
   }
   ```

## Examples of Operators

### Default Value Operator

The `.default` operator specifies a default value for an optional field:

```cddl
optional = tstr .default "foobar"
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "optional",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "tstr",
      "Operator": {
        "Type": "default",
        "Value": {
          "Type": "literal",
          "Value": "foobar",
          "Unwrapped": false
        }
      }
    }
  ],
  "Comments": []
}
```

### Size Operator

The `.size` operator constrains the size of a value:

```cddl
ip4 = bstr .size 4
```

AST representation:

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

### Size Operator with Range

The `.size` operator can also use a range:

```cddl
label = bstr .size (1..63)
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "label",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "bstr",
      "Operator": {
        "Type": "size",
        "Value": {
          "Type": "range",
          "Value": {
            "Min": 1,
            "Max": 63,
            "Inclusive": true
          },
          "Unwrapped": false
        }
      }
    }
  ],
  "Comments": []
}
```

### Regular Expression Operator

The `.regexp` operator specifies a pattern for text strings:

```cddl
nai = tstr .regexp "[A-Za-z0-9]+@[A-Za-z0-9]+(\.[A-Za-z0-9]+)+"
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "nai",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": "tstr",
      "Operator": {
        "Type": "regexp",
        "Value": {
          "Type": "literal",
          "Value": "[A-Za-z0-9]+@[A-Za-z0-9]+(\\.[A-Za-z0-9]+)+",
          "Unwrapped": false
        }
      }
    }
  ],
  "Comments": []
}
```

### Comparison Operators

The `.ge`, `.gt`, `.le`, `.lt`, `.eq`, and `.ne` operators specify numerical constraints:

```cddl
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
  "Comments": []
}
```

### Logical Operators

The `.and` and `.within` operators combine constraints:

```cddl
foo = ip4 .and nai
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "foo",
  "IsChoiceAddition": false,
  "PropertyType": [
    {
      "Type": {
        "Type": "group",
        "Value": "ip4",
        "Unwrapped": false
      },
      "Operator": {
        "Type": "and",
        "Value": {
          "Type": "group",
          "Value": "nai",
          "Unwrapped": false
        }
      }
    }
  ],
  "Comments": []
}
```

### Operator on Properties in Groups

Operators can be applied to properties in groups:

```cddl
someGroup = {
  optional: tstr .default "foobar" ?,
  orientation: ("portrait" / "landscape") .default "portrait" ?,
  scale: (0.1..2) .default 1 ?,
  shrinkToFit: bool .default true ?
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "someGroup",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": true,
      "Occurrence": { "n": 0, "m": Infinity },
      "Name": "optional",
      "Type": [
        {
          "Type": "tstr",
          "Operator": {
            "Type": "default",
            "Value": {
              "Type": "literal",
              "Value": "foobar",
              "Unwrapped": false
            }
          }
        }
      ],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 0, "m": Infinity },
      "Name": "orientation",
      "Type": [
        {
          "Type": "literal",
          "Value": "portrait",
          "Unwrapped": false
        },
        {
          "Type": "literal",
          "Value": "landscape",
          "Unwrapped": false
        }
      ],
      "Operator": {
        "Type": "default",
        "Value": {
          "Type": "literal",
          "Value": "portrait",
          "Unwrapped": false
        }
      },
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 0, "m": Infinity },
      "Name": "scale",
      "Type": [
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
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 0, "m": Infinity },
      "Name": "shrinkToFit",
      "Type": [
        {
          "Type": "bool",
          "Operator": {
            "Type": "default",
            "Value": {
              "Type": "literal",
              "Value": true,
              "Unwrapped": false
            }
          }
        }
      ],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## Operator Placement in the AST

There are two common patterns for where operators appear in the AST:

1. **Type-level operators**: The operator is attached directly to the type. This is represented by the `Operator` field being part of the type:
   ```json
   {
     "Type": "tstr",
     "Operator": {
       "Type": "default",
       "Value": {
         "Type": "literal",
         "Value": "foobar",
         "Unwrapped": false
       }
     }
   }
   ```

2. **Property-level operators**: The operator applies to the entire property rather than just the type. This is represented by the `Operator` field being part of the property:
   ```json
   {
     "HasCut": true,
     "Name": "orientation",
     "Type": [...],
     "Operator": {
       "Type": "default",
       "Value": {...}
     }
   }
   ```

By understanding these operator representations in the AST, you can properly interpret and process CDDL constraints for further transformation or analysis.
