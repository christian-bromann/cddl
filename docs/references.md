# Property References

Property references in CDDL allow referring to previously defined types, groups, literals, and other constructs. This document explains how property references are represented in the AST.

## Property Reference Definition

In the AST, a property reference is represented by the following structure:

```typescript
export type PropertyReferenceType = 'literal' | 'group' | 'group_array' | 'array' | 'range' | 'tag'

export type PropertyReference = {
    Type: PropertyReferenceType
    Value: string | number | boolean | Group | Array | Range | Tag
    Unwrapped: boolean
    Operator?: Operator
}
```

Where:
- `Type`: The type of reference
- `Value`: The value being referenced (can be various types)
- `Unwrapped`: A boolean indicating if this reference should be unwrapped (applicable for arrays and groups)
- `Operator`: An optional operator that modifies the referenced value

## Reference Types

The AST supports several types of references:

1. `literal`: References a literal value (string, number, boolean)
2. `group`: References a named group
3. `group_array`: References a group that should be treated as an array
4. `array`: References a named array
5. `range`: References a range definition
6. `tag`: References a tag definition

## Examples of Property References

### Reference to a Named Group

```cddl
person = {
    address: address
}

address = {
    street: tstr,
    city: tstr
}
```

AST representation of the reference:

```json
{
  "Type": "group",
  "Value": "address",
  "Unwrapped": false
}
```

### Reference to a Literal Value

```cddl
status = "active" / "inactive" / "suspended"
```

AST representation:

```json
{
  "Type": "variable",
  "Name": "status",
  "IsChoiceAddition": false,
  "PropertyType": [
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
```

### Reference with Unwrapping

```cddl
basic-header = [
    field1: int,
    field2: text
]

advanced-header = [
    ~basic-header,
    field3: bytes
]
```

AST representation of the unwrapped reference:

```json
{
  "Type": "group",
  "Value": "basic-header",
  "Unwrapped": true
}
```

### Reference to a Range

```cddl
port = 0..65535
```

AST representation:

```json
{
  "Type": "range",
  "Value": {
    "Min": 0,
    "Max": 65535,
    "Inclusive": true
  },
  "Unwrapped": false
}
```

### Reference to a Tag

```cddl
my_uri = #6.32(tstr) / tstr
```

AST representation:

```json
{
  "Type": "tag",
  "Value": {
    "NumericPart": 6.32,
    "TypePart": "tstr"
  },
  "Unwrapped": false
}
```

## Reference with Operator

```cddl
ip4 = bstr .size 4
foo = ip4 .and nai
```

AST representation:

```json
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
```

## References in Group Composition

References can be used for group composition, where one group incorporates all the properties of another:

```cddl
person = {
    name: tstr,
    age: uint
}

employee = {
    person,
    employeeId: uint,
    department: tstr
}
```

AST representation of the composition:

```json
{
  "Type": "group",
  "Name": "employee",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": false,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "",
      "Type": [
        {
          "Type": "group",
          "Value": "person",
          "Unwrapped": false
        }
      ],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "employeeId",
      "Type": ["uint"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "department",
      "Type": ["tstr"],
      "Comments": []
    }
  ],
  "Comments": []
}
```

## References in Array Elements

References can be used to define array elements:

```cddl
people = [* person]
```

AST representation:

```json
{
  "Type": "array",
  "Name": "people",
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

## Nested References

References can refer to complex nested structures:

```cddl
location = {
    city: tstr,
    country: {
        name: tstr,
        code: tstr
    }
}
```

AST representation:

```json
{
  "Type": "group",
  "Name": "location",
  "IsChoiceAddition": false,
  "Properties": [
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "city",
      "Type": ["tstr"],
      "Comments": []
    },
    {
      "HasCut": true,
      "Occurrence": { "n": 1, "m": 1 },
      "Name": "country",
      "Type": [
        {
          "Type": "group",
          "Name": "",
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
              "Name": "code",
              "Type": ["tstr"],
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

By understanding these property reference representations in the AST, you can properly interpret and process CDDL references for further transformation or analysis.
