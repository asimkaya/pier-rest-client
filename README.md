# Pier

A **local-first**, **privacy-first** REST API desktop client for Windows, macOS, and Linux. Built with [Tauri v2](https://tauri.app/) and [SolidJS](https://www.solidjs.com/). No account required — collections, environments, and history stay on your machine as JSON files.

## Features

- **HTTP requests** — Methods, URL, query params, headers, body (JSON, raw, form-data)
- **Auth** — None, Bearer, Basic, API Key (header or query)
- **Response** — Pretty JSON with syntax highlighting, raw body, headers; status, timing, size; copy body (pretty or raw)
- **Tabs** — Multiple requests at once; inline rename; new tabs become saved standalone requests automatically
- **Collections** — Folders and requests; context menu; drag standalone requests into collections
- **Environments** — Variables with `{{name}}` interpolation on URL, headers, body, and auth
- **History** — Recent requests with quick re-open
- **Command palette** — `Ctrl+K` for actions and navigation
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

## Getting started

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>

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
