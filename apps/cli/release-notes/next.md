## Highlights

### Relay Desktop (mac, windows, linux)

The CLI's web UI now ships as a native desktop app. Same gateway, same UI, same sources — packaged with the Bun-compiled server bundled inside the Electron app so there's no Node install, no `relay web` running in your terminal, no port to remember.

- Drag-to-Applications DMG with the Relay icon. Auto-updates via `electron-updater` directly from GitHub releases.
- macOS builds are signed with a Developer ID Application cert and notarized through the App Store Connect API — first launch is a single click, no Gatekeeper dance.
- State lives at `~/.relay/` — the same path the CLI uses. Sources, secrets, and policies set up in `relay web` show up in the desktop app and vice versa.
- Linux: AppImage / deb / rpm for x64 and arm64. Windows: `.exe` (currently unsigned — code-signing pipeline in flight).

Downloads land on each [GitHub release](https://github.com/gothamdev244/relay/releases/latest) under the `relay-desktop-*` assets.

## UI

- Sidebar now shows a "Beta" pill next to the relay wordmark.

## Fixes

- Source configuration is no longer replayed from or written back to `relay.jsonc`; local source state stays in the shared Relay database while `relay.jsonc` continues to load plugin entries.
