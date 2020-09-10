CDDL
====

Concise data definition language (RFC 8610) implementation and JSON validator in Node.js

## ToDo

- [ ] Support type choices ([section 2.2.2](https://tools.ietf.org/html/draft-ietf-cbor-cddl-08#section-2.2.2))

  ```cddl
  attire = "bow tie" / "necktie" / "Internet attire"
  protocol = 6 / 17
  ```