<p align="center">
  <img src="pier-logo.png" alt="Pier logo" width="88" height="88" />
</p>

<h1 align="center">Pier</h1>

<p align="center">
  <strong>Local-first REST API desktop client</strong><br />
  Windows · macOS · Linux · <a href="https://tauri.app/">Tauri v2</a> · <a href="https://www.solidjs.com/">SolidJS</a>
</p>

A **local-first**, **privacy-first** REST client. No account — collections, environments, and history stay on your machine as JSON files.

## Screenshot

<p align="center">
  <img
    src="pier-screenshot.png"
    alt="Pier: sidebar with collections, request editor, and pretty JSON response"
    width="960"
  />
</p>

## Features

- **HTTP requests** — Methods, URL, query params, headers, body (JSON, raw, form-data)
- **Auth** — None, Bearer, Basic, API Key (header or query)
- **Request editor** — CodeMirror-powered JSON/raw body editing with syntax highlighting and bracket assistance
- **Response** — Pretty JSON with syntax highlighting, raw body, headers; status, timing, size; copy body (pretty or raw), inline search with match navigation
- **Tabs** — Multiple requests at once; inline rename; new tabs become saved standalone requests automatically
- **Collections** — Folders and requests; context menu; drag standalone requests into collections
- **Environments** — Variables with `{{name}}` interpolation on URL, headers, body, and auth
- **History** — Recent requests with quick re-open
- **Import / Export** — Workspace backup JSON export/import for collections, saved requests, and environments
- **cURL import** — Paste cURL into the URL bar or use the dedicated import modal to build a request instantly
- **Command palette** — `Ctrl+K` for actions, import/export, and navigation
- **Themes** — Dark, light, or follow the system

## Tech stack

| Layer | Stack |
|--------|--------|
| Shell | Tauri v2, Rust |
| UI | SolidJS, TypeScript, Tailwind CSS v4 |
| HTTP | reqwest (Rust; no browser CORS) |
| Data | JSON files in the app data directory |
| Tooling | Bun, Vite |

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Bun](https://bun.sh/)
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

## Download

Download the installer for your platform from [GitHub Releases](https://github.com/asimkaya/pier-rest-client/releases).

| Platform | Installer |
|----------|-----------|
| Windows x64 | `.exe` (NSIS) |
| macOS Apple Silicon | `.dmg` |

> **Windows:** SmartScreen may warn on first run — click “More info” → “Run anyway”.  
> **macOS:** If Gatekeeper blocks the app, go to **System Settings → Privacy & Security** and click “Open Anyway”.

## Getting started

```bash
git clone https://github.com/asimkaya/pier-rest-client
cd pier-rest-client

bun install
bun run tauri dev
```

**Production build**

```bash
bun run tauri build
```

**Other scripts**

```bash
./node_modules/.bin/tsc --noEmit   # typecheck
bun run lint
bun run format
```

## Documentation

- [`DEVELOPMENT.md`](DEVELOPMENT.md) — architecture, data layout, UI patterns (modals, tabs, stores), and conventions for contributors

## Contributing

Issues and pull requests are welcome. For larger changes, skim `DEVELOPMENT.md` first so patches match existing patterns (Solid stores, Tauri commands, modal UX).

## Privacy

No cloud sync, no telemetry, no sign-in. Credentials and collections live only in your local app data folder.

## License

[MIT](LICENSE)
