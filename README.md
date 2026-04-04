# Volt API Client

A **local-first**, **privacy-first**, **ultra-fast** REST API client for developers.

Volt is a desktop application built with [Tauri](https://tauri.app/) and [SolidJS](https://www.solidjs.com/) that lets you build, test, and manage API requests — all without an account, with your data stored entirely on your machine.

## Features

- **Request Builder** — Compose HTTP requests with method, URL, headers, query params, and body (JSON, raw, form-data)
- **Authentication** — Bearer Token, Basic Auth, API Key support
- **Response Viewer** — Pretty JSON, raw text, and response headers with timing & size info
- **Multi-Tab** — Work on multiple requests simultaneously
- **Collections** — Organize your requests into folders and collections
- **Environments** — Define variables (`{{base_url}}`, `{{token}}`) and switch between environments
- **History** — Automatically log every request for quick replay
- **Command Palette** — `Ctrl+K` to search and execute actions instantly
- **Dark/Light Theme** — Follows your system preference with manual override

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| Frontend | SolidJS + TypeScript |
| Styling | TailwindCSS v4 |
| UI Components | Kobalte (headless) |
| HTTP Engine | Rust (reqwest) |
| Storage | JSON files (local) |
| Package Manager | Bun |

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.77+)
- [Bun](https://bun.sh/) (1.0+)
- Platform-specific dependencies for [Tauri](https://v2.tauri.app/start/prerequisites/)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/nicepkg/volt.git
cd volt

# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## Project Structure

```
├── src/                  # SolidJS frontend
│   ├── components/ui/    # Reusable UI components
│   ├── features/         # Feature modules
│   ├── lib/              # Utilities and types
│   └── styles/           # Global styles
├── src-tauri/            # Rust backend
│   ├── src/commands/     # Tauri commands (HTTP, storage)
│   └── src/models/       # Data models
└── ...config files
```

## Privacy

Volt stores all data locally on your machine. No accounts, no cloud sync, no telemetry. Your API keys and tokens never leave your device.

## License

[MIT](LICENSE)
