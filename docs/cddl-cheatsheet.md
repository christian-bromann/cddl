# CDDL Core Concepts: Choices and Maps

This guide explains three fundamental concepts in CDDL that are often confused: **Type Choices**, **Group Choices**, and **Maps**.

## 1. Type Choice (`/`)

A **Type Choice** allows a value to be one of several distinct types. It is represented by the single forward slash `/`.

Think of it as an "OR" operator for *values*.

### Syntax
```cddl
type1 / type2 / type3
```

### Examples

**Simple Value Choice:**
```cddl
; MyValue can be an integer OR a text string
MyValue = int / tstr
```

**Inside an Array:**
```cddl
; An array where the first element is either an int OR a float
MyArray = [ int / float, tstr ]
```

**Inside a Map Property:**
```cddl
; The "score" property can be an integer OR null
MyMap = {
    "score" => int / null
}
```

---

## 2. Group Choice (`//`)

A **Group Choice** allows a structure (like a map or array) to match one of several *groups* of properties. It is represented by the double forward slash `//`.

Think of it as an "OR" operator for *sets of fields/entries*.

### Syntax
```cddl
(group1) // (group2) // (group3)
```

### Examples

**Choice between sets of fields:**
```cddl
; A defined group that is either a "street address" OR a "po box"
Address = (
    street: tstr,
    city: tstr
) // (
    po-box: int,
    city: tstr
)
```

**Usage in Maps:**
When used inside a map, it means the map must contain *either* the keys from the first group *OR* the keys from the second group.

```cddl
; A user profile must have either a "username" OR an "email" (but not necessarily both, depending on other rules)
UserProfile = {
    id: int,
    (
        username: tstr
    ) // (
        email: tstr
    )
}
```

**Key Difference from Type Choice:**
- `key: int / tstr` -> The key exists, and its value is either int or string.
- `(key1: int) // (key2: int)` -> Either the key `key1` exists OR the key `key2` exists.

---

## 3. Maps

In CDDL, a **Map** is defined using curly braces `{}`. It corresponds to a JSON Object or a dictionary/hash map.

Inside a Map, you define **Groups** of properties/pairs using `key => value` or `key: value` syntax.

### Syntax
```cddl
MyMap = {
    key1 => value1,
    key2: value2,
    optional-key3?: value3
}
```

### Deep Dive: Maps vs. Groups

- A **Group** is just a sequence of fields (key-value pairs) inside a structure.
- A **Map** `{ ... }` acts as a container for a Group.

**Defining a reusable Group:**
```cddl
; "PersonFields" is just a list of fields, NOT a map yet.
PersonFields = (
    name: tstr,
    age: int
)
```

**Using the Group in a Map:**
```cddl
; "Student" is a Map that contains the PersonFields
Student = {
    PersonFields,
    school: tstr
}

; "Teacher" is also a Map that contains the PersonFields
Teacher = {
    PersonFields,
    subject: tstr
}
```

### Mixing Choices in Maps

You can combine Maps and Choices to create complex validation logic:

```cddl
Response = {
    "status" => "ok",
    "data" => tstr
} / {
    "status" => "error",
    "code" => int,
    "message" => tstr
}
```
*This definition means a Response object must look like EITHER the first block (status="ok", data=...) OR the second block (status="error", code=...).*

---

## 4. Arrays

Arrays in CDDL are defined using square brackets `[]`. They correspond to JSON Arrays.

### Syntax
```cddl
MyArray = [ type1, type2, ... ]
```

### Examples

**Simple Array:**
```cddl
; An array of an integer, a string, and a float
Point3D = [ x: float, y: float, z: float ]
```

**Array with Group Choice:**
You can use group choices inside arrays to allow different structures.

```cddl
; An item is either an integer OR a string
Item = [ (int // tstr) ]
```

---

## 5. Literals

CDDL supports various literal values which are useful for exact matching.

### Examples

```cddl
LiteralTest = {
  ; Exact string match
  type: "widget",

  ; Exact integer match
  version: 1,

  ; Big Integers
  big_id: 9007199254740995,

  ; Null and Booleans
  is_active: true,
  deleted_at: null
}

---

## 6. Groups as Maps

Wrap a **Group** in curly braces `{}` to treat it as a **Map**.

```cddl
; A reusable Group of fields
DateFields = ( year: int, month: int, day: int )

; 1. Mix it into a Map
Appointment = {
  description: tstr,
  DateFields
}

; 2. Standalone Map
DateObject = { DateFields }
```

### Choices with Groups and Maps

You can mix explicit Maps and Groups-as-Maps in type choices:

```cddl
ArrayMap = { type: "array", values: [...] }
DateGroup = ( type: "date", value: tstr )

; Matches either map structure
MixedValue = (
  ArrayMap /      ; Map defined elsewhere
  { DateGroup }   ; Group wrapped in Map
)
```
```
