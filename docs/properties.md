# Properties

Properties are a fundamental component of CDDL that define the members of groups and elements of arrays. This document explains how properties are represented in the AST.

## Property Definition

In the AST, a property is represented by the following structure:

```typescript
export type Property = {
    HasCut: boolean
    Occurrence: Occurrence
    Name: PropertyName
    Type: PropertyType | PropertyType[]
    Comments: Comment[]
    Operator?: Operator
}
```

Where:
- `HasCut`: A boolean indicating if the property has a "cut" marker (/)
- `Occurrence`: An object defining how many times the property can occur
- `Name`: The name of the property (string)
- `Type`: The type(s) of the property
- `Comments`: An array of comments associated with the property
- `Operator`: An optional operator modifying the property

## Property Names

Property names are simple strings that identify the property within a group or array. A property can also have an empty name (`""`), which is used for:

1. Unnamed elements in arrays
2. Group composition (including one group within another)

## Occurrence Definition

The occurrence of a property defines how many times it can appear. It is represented by:

```typescript
export type Occurrence = {
    n: number   // Minimum occurrence
    m: number   // Maximum occurrence
}
```

Common occurrence patterns:
- `{ n: 1, m: 1 }`: Exactly one time (default)
- `{ n: 0, m: Infinity }`: Zero or more times (`*`)
- `{ n: 1, m: Infinity }`: One or more times (`+`)
- `{ n: 0, m: 1 }`: Zero or one time (`?`)
- `{ n: a, m: b }`: At least `a` and at most `b` times (`a*b`)

## Cut Marker

The `HasCut` field indicates whether the property has a cut marker (`/`) in CDDL. In CDDL syntax, a cut marker indicates that the property should be matched exactly once, even if the property appears later in an extended group.

Example in CDDL:
```cddl
person = {
    name: tstr,
    / age: uint,
}
```

AST representation:
```json
{
  "HasCut": true,
  "Occurrence": { "n": 1, "m": 1 },
  "Name": "age",
  "Type": ["uint"],
  "Comments": []
}
```

## Property Types

The `Type` field can contain various types of values:

1. A string representing a primitive type:
   ```json
   "Type": ["tstr"]
   ```

2. A reference to a named type:
   ```json
   "Type": [
     {
       "Type": "group",
       "Value": "address",
       "Unwrapped": false
     }
   ]
   ```

3. An array of alternative types (choices):
   ```json
   "Type": ["tstr", "uint"]
   ```

4. A literal value:
   ```json
   "Type": [
     {
       "Type": "literal",
       "Value": "active",
       "Unwrapped": false
     }
   ]
   ```

5. A nested structure (group or array):
   ```json
   "Type": [
     {
       "Type": "group",
       "Name": "",
       "Properties": [...],
       "Comments": []
     }
   ]
   ```

## Property Examples

### Basic Property

```cddl
person = {
    name: tstr,
    age: uint
}
```

AST representation of the "name" property:

```json
{
  "HasCut": true,
  "Occurrence": { "n": 1, "m": 1 },
  "Name": "name",
  "Type": ["tstr"],
  "Comments": []
}
```

### Optional Property

```cddl
person = {
    name: tstr,
    ?email: tstr
}
```

AST representation of the "email" property:

```json
{
  "HasCut": true,
  "Occurrence": { "n": 0, "m": Infinity },
  "Name": "email",
  "Type": ["tstr"],
  "Comments": []
}
```

### Property with Occurrence Indicator

```cddl
someGroup = {
    optional: tstr ?,               ; zero or more
    anotherOptional: tstr *,        ; zero or more
    atLeastOne: tstr +,             ; one or more
    numberedOccurence: tstr 23*42,  ; between 23 and 42
    withoutLeftSide: tstr *42,      ; at most 42
    withoutRightSide: tstr 23*      ; at least 23
}
```

AST representation of "numberedOccurence":

```json
{
  "HasCut": true,
  "Occurrence": { "n": 23, "m": 42 },
  "Name": "numberedOccurence",
  "Type": ["tstr"],
  "Comments": []
}
```

### Property with Comments

```cddl
person = {
    ; a good employer
    employer: tstr
}
```

AST representation:

```json
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
```

### Property with Choice of Types

```cddl
person = {
    id: uint / tstr
}
```

AST representation:

```json
{
  "HasCut": true,
  "Occurrence": { "n": 1, "m": 1 },
  "Name": "id",
  "Type": ["uint", "tstr"],
  "Comments": []
}
```

### Property with Default Value

```cddl
someGroup = {
    optional: tstr .default "foobar" ?,
    orientation: ("portrait" / "landscape") .default "portrait" ?,
    scale: (0.1..2) .default 1 ?,
    shrinkToFit: bool .default true ?
}
```

AST representation of "optional":

```json
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
}
```

AST representation of "orientation":

```json
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
}
```

## Group Member Properties vs. Array Element Properties

Properties are used in both groups and arrays, but their interpretation differs slightly:

1. In groups, properties typically have names (except for group composition cases)
2. In arrays, elements can be named or unnamed and can have occurrence indicators

Array element example:

```cddl
Geography = [
    city: tstr,
    * float
]
```

AST representation of the unnamed element:

```json
{
  "HasCut": false,
  "Occurrence": { "n": 0, "m": Infinity },
  "Name": "",
  "Type": ["float"],
  "Comments": []
}
```

By understanding these different property representations in the AST, you can properly interpret and process CDDL property definitions for further transformation or analysis.
