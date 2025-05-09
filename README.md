CDDL [![Test](https://github.com/christian-bromann/cddl/actions/workflows/test.yml/badge.svg)](https://github.com/christian-bromann/cddl/actions/workflows/test.yml)
====

> Concise data definition language ([RFC 8610](https://tools.ietf.org/html/rfc8610)) implementation and JSON validator in Node.js.

CDDL expresses Concise Binary Object Representation (CBOR) data structures ([RFC 7049](https://tools.ietf.org/html/rfc7049)). Its main goal is to provide an easy and unambiguous way to express structures for protocol messages and data formats that use CBOR or JSON.

There are also CDDL parsers for other languages:
- Rust: [anweiss/cddl](https://github.com/anweiss/cddl)

The package is currently mostly used to help generate typed interfaces for the WebDriver Bidi specification in the following projects:
- [WebdriverIO](https://webdriver.io) - via the [`cddl2ts`](https://www.npmjs.com/package/cddl2ts) package and [this script](https://github.com/webdriverio/webdriverio/blob/a2ae35332f9b3fc9490136df1ac3d2e14c1e35b6/scripts/bidi/index.ts)
- [Selenium](https://selenium.dev) - via the [`cddl2java`](https://github.com/christian-bromann/cddl2java) package

__Note:__ this is __work in progress__, feel free to have a look at the code or contribute but don't use this for anything yet!

## Install

To install this package run:

```sh
$ npm install cddl
```

## Using this package

This package exposes a CLI as well as a programmatic interface for parsing and transforming CDDL.

### CLI

The `cddl` CLI offers a `validate` command that helps identify invalid CDDL formats, e.g.:

```sh
npx cddl validate ./path/to/interface.cddl
✅ Valid CDDL file!
```

### Programmatic Interface

You can also use this package to parse a CDDL file into an [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST). For example, given the following CDDL file:

```cddl
person = {
    identity,       ; an identity
    employer: tstr, ; some employer
}
```

It parses the content into an AST:

```js
import { parse } from 'cddl'

const ast = parse('./spec.cddl')
console.log(ast)
/**
 * outputs:
 * [
 *   {
 *     Type: 'group',
 *     Name: 'person',
 *     Properties: [ [Object], [Object] ],
 *     IsChoiceAddition: false
 *   }
 * ]
 */
```

Read the full documentation on this AST in the [`/docs`](/docs/README.md) directory.

---

If you are interested in this project, please feel free to contribute ideas or code patches. Have a look at our [contributing guidelines](https://github.com/christian-bromann/cddl/blob/master/CONTRIBUTING.md) to get started.
