# Vendored json-schema-to-typescript

Vendored SDK-internal compiler code based on Boris Cherny's
`json-schema-to-typescript@15.0.4`.

The Relay copy keeps the schema compiler API used by `@relay-sh/sdk` and
removes the Prettier formatting dependency. Generated output is intentionally
left unformatted; callers that display previews should normalize it themselves.
It also resolves only same-document JSON Pointer `$ref`s; external file and URL
refs are rejected rather than fetched or read. It is not a public package
surface.

The upstream project is MIT licensed; the original copyright notice is included
in `LICENCE.md`.
