# Using Relay as an MCP server with Claude Code

Share your entire tool catalog with Claude Code through Relay's MCP server.

## Step 1 — Install Relay

```bash
npm install -g relay
```

## Step 2 — Start Relay and add a source

Start the web UI:

```bash
relay web
```

Open `http://127.0.0.1:4788`, click **Add Source**, and paste the Petstore spec URL:

```
https://petstore3.swagger.io/api/v3/openapi.json
```

Relay detects the type, indexes every operation, and handles auth.

## Step 3 — Start Relay as an MCP server

```bash
relay mcp
```

This launches an MCP endpoint over stdio that any compatible agent can connect to.

## Step 4 — Configure Claude Code

Add this to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "relay": {
      "command": "relay",
      "args": ["mcp"]
    }
  }
}
```

Restart Claude Code. It will discover all tools Relay exposes.

## Step 5 — Use tools from Claude Code

Ask Claude Code:

> List all available pets from the petstore.

Claude Code calls the `petstore.findPetsByStatus` tool through Relay and returns the results.

Other things to try: "Add a new pet called Bingo", "Find pets with status available".

## Alternative: Remote HTTP mode

If Relay is already running (e.g. via `relay web` or `relay daemon run`), point Claude Code at the HTTP endpoint instead of spawning a new process:

```json
{
  "mcpServers": {
    "relay": {
      "url": "http://127.0.0.1:4788/mcp"
    }
  }
}
```

This uses Streamable HTTP transport and connects to the running daemon, sharing the same sources, auth, and policies across all your agents.

See `mcp-config.json` in this directory for a ready-to-copy configuration file.
