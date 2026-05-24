# Contributing to Relay

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Node.js](https://nodejs.org) 22+

## Setup

```bash
git clone https://github.com/gothamdev244/relay.git
cd relay
bun install
bun run prepare
```

## Development

```bash
bun run dev
```

Starts the turbo dev server (excludes cloud and desktop apps). The web UI is available at `http://127.0.0.1:4788`.

## Testing

```bash
bun run test
```

## Linting & Formatting

```bash
bun run lint      # oxlint
bun run format    # oxfmt
```

## Monorepo Structure

```
apps/
  cli/            # relay CLI
  cloud/          # hosted service
  desktop/        # desktop app
  local/          # local runtime
  marketing/      # relay.sh website

packages/
  core/           # core runtime and types
  plugins/        # source plugins (OpenAPI, GraphQL, MCP, etc.)
  kernel/         # low-level internals
  app/            # shared app utilities
  react/          # React components for web UI
```

## Pull Request Requirements

- `bun run lint` and `bun run typecheck` must pass.
- Use [changesets](https://github.com/changesets/changesets) for new features or breaking changes (`bunx changeset`).
- Keep PRs focused -- one concern per PR.
