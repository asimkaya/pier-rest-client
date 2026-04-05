# Pier — Development Status & Architecture

> **Last updated:** 2026-04-05
> **Version:** 0.1.0 (pre-release, active development)

---

## 1. Project Overview

**Pier** is a local-first, privacy-first, ultra-fast REST API desktop application built with **Tauri v2** (Rust backend) and **SolidJS** (TypeScript frontend). It runs natively on Windows, macOS, and Linux. All data is stored locally as JSON files — no cloud, no accounts, no telemetry.

Think of it as a lightweight, open-source alternative to Postman/Insomnia with a focus on speed and privacy.

---

## 2. Current Status Summary

| Area | Status | Notes |
|------|--------|-------|
| Project scaffolding | Done | Tauri v2 + SolidJS + Bun + TailwindCSS v4 |
| Custom titlebar | Done | Drag, minimize, maximize (dblclick), close |
| Tab system | Done | Create, close, rename (inline); new tab = standalone saved + `savedLocation`; rename syncs to disk |
| Request builder | Done | Method selector, URL bar, params, headers, body (JSON/raw/form), auth |
| HTTP engine (Rust) | Done | reqwest-based, JSON/raw/multipart, timing, redirects |
| Response viewer | Done | Pretty (formatted + `highlight.js` colors), raw, headers, meta; Body copy button (pretty vs raw) |
| Collections | Done | CRUD, rename (context + pencil), folders, requests; custom delete/confirm modals (no `window.confirm`) |
| Standalone saved requests | Done | New tab / Ctrl+S / empty-state New Request; sidebar rename, move, delete with modal; DnD move |
| Environments | Done | CRUD, variable interpolation (`{{var}}`), env selector in titlebar |
| History | Done | Auto-logged, grouped by date, re-open, clear |
| Command palette | Done | Ctrl+K, fuzzy search, keyboard navigation, clickable from titlebar |
| Dark/Light/System theme | Done | CSS variable-based, toggled via command palette |
| Keyboard shortcuts | Done | Ctrl+T → `createNewRequestTab`; Ctrl+W (close), Ctrl+S (save), Ctrl+K (commands) |
| Accessibility | Partial | ARIA labels present, focus management needs refinement |
| Tests | Not started | No unit or integration tests yet |
| CI/CD | Not started | No GitHub Actions or release pipeline |
| App icons | Done | `pier-logo.png` (512²) → `bun run tauri icon pier-logo.png -o src-tauri/icons`; `public/` favicons for Vite |
| Documentation (user-facing) | Not started | Only this dev doc and README exist |

---

## 3. Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| SolidJS | ^1.9 | Reactive UI framework |
| TypeScript | ^5.6 | Type safety |
| TailwindCSS | ^4.0 | Utility-first styling |
| Vite | ^6.0 | Build tool & dev server |
| Kobalte | ^0.13 | Headless accessible components (available, partially used) |
| solid-motionone | ^1.0 | Animations (available, partially used) |
| class-variance-authority | ^0.7 | Component variant styling |
| clsx + tailwind-merge | ^2.x | Class name utilities |
| highlight.js | ^11 | JSON syntax highlighting for response Body → Pretty (read-only) |

### Backend (Rust)
| Crate | Version | Purpose |
|-------|---------|---------|
| tauri | 2 | Desktop shell, IPC, window management |
| tauri-plugin-fs | 2 | File system access from frontend |
| tauri-plugin-shell | 2 | Shell/URL opening |
| tauri-plugin-log | 2 | Logging (debug builds only) |
| reqwest | 0.12 | HTTP client (json + multipart features) |
| tokio | 1 (full) | Async runtime |
| serde / serde_json | 1 | Serialization |
| uuid | 1 (v4) | ID generation (available, not actively used yet) |
| chrono | 0.4 (serde) | Date/time (available, not actively used yet) |
| urlencoding | 2 | URL parameter encoding |

### Tooling
| Tool | Purpose |
|------|---------|
| Bun | Package manager & JS runtime (used by Tauri build commands) |
| Cargo | Rust package manager & build system |
| ESLint | Linting (configured in package.json scripts) |
| Prettier | Code formatting |

---

## 4. Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Tauri Window                       │
│  ┌───────────────────────────────────────────────┐  │
│  │              Custom Titlebar                   │  │
│  │  [Logo] [Pier]   [Env▾] [⚙ Ctrl+K]  [─][□][✕]│  │
│  ├────────┬──────────────────────────────────────┤  │
│  │Sidebar │  Tab Bar                              │  │
│  │        ├──────────────────────────────────────┤  │
│  │Saved   │  Request Builder  │  Response Viewer  │  │
│  │Requests│  ─────────────── │  ──────────────── │  │
│  │        │  Method + URL    │  Status + Meta     │  │
│  │Collec- │  Params/Headers  │  Body (pretty/raw) │  │
│  │tions   │  Body/Auth       │  Headers            │  │
│  │        │                  │                     │  │
│  │History │                  │                     │  │
│  │Env     │                  │                     │  │
│  ├────────┴──────────────────┴─────────────────── │  │
│  │              [+ New Request]                    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Command Palette overlay — Ctrl+K]                 │
└─────────────────────────────────────────────────────┘
```

### 4.2 Data Flow: Sending a Request

```
User clicks "Send"
      │
      ▼
RequestBuilder.handleSend()
      │
      ├── Resolves {{variables}} using active environment
      ├── Builds TauriHttpRequest (headers, params, auth, body)
      │
      ▼
invoke("send_request", { request })   ──── Tauri IPC ────►  Rust: send_request()
                                                                    │
                                                                    ├── reqwest::Client::request()
                                                                    ├── Adds headers, body, query params
                                                                    ├── Measures timing (Instant)
                                                                    ├── Reads response bytes
                                                                    │
                                                              ◄─────┘  Returns HttpResponse
      │
      ▼
setTabResponse(tabId, response)
addHistoryEntry(log)
saveHistory()
```

### 4.3 Data Storage

All data is stored as JSON files in the OS-specific app data directory (`AppData/Roaming` on Windows, `~/Library/Application Support` on macOS).

```
<app_data_dir>/
├── collections/
│   ├── <collection-id>.json     # Each collection is a separate file
│   └── ...
├── environments/
│   └── environments.json        # All environments in one file
├── history/
│   └── history.json             # Last 100 requests
└── saved-requests.json          # Standalone (not in collection) requests
```

Storage is managed through Rust Tauri commands:
- `read_json_file(relative_path)` → reads from app data dir
- `write_json_file(relative_path, content)` → writes JSON
- `delete_json_file(relative_path)` → removes file
- `list_json_files(relative_dir)` → lists files in directory

---

## 5. Project Structure

```
rest-api-client-app/
├── index.html                      # Vite entry HTML
├── public/                         # Static assets (favicon, titlebar mark — copied from Tauri icon output)
├── pier-logo.png                   # Source 512² for `tauri icon` (regenerates src-tauri/icons)
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite + SolidJS + TailwindCSS config
├── tsconfig.json                   # TypeScript config (~ alias → ./src)
├── README.md                       # Project README
├── LICENSE                         # MIT
├── prd.md                          # Original product requirements
├── DEVELOPMENT.md                  # THIS FILE
│
├── src/                            # Frontend source (SolidJS + TypeScript)
│   ├── index.tsx                   # App mount point
│   ├── app.tsx                     # Root layout, data loading, panel splitter
│   │
│   ├── styles/
│   │   └── globals.css             # TailwindCSS theme, dark/light vars, scrollbar, cursor
│   │
│   ├── lib/
│   │   ├── types.ts                # All TypeScript interfaces & type definitions
│   │   ├── utils.ts                # cn(), generateId(), formatters, color helpers
│   │   ├── tauri.ts                # Tauri invoke wrappers (sendRequest, file I/O)
│   │   ├── keybindings.ts          # Global keyboard shortcuts (Ctrl+T/W/S/K)
│   │   ├── json-highlight.ts       # highlight.js wrapper for Pretty response body
│   │   └── variable-resolver.ts    # {{variable}} interpolation engine
│   │
│   ├── store/
│   │   └── app-store.ts            # Global SolidJS store (tabs, collections, env, history, theme)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── titlebar.tsx        # Custom window titlebar (drag, dblclick maximize)
│   │   └── ui/
│   │       ├── button.tsx          # Button component (CVA variants)
│   │       ├── input.tsx           # Input component
│   │       ├── select.tsx          # Select component
│   │       └── badge.tsx           # Badge component
│   │
│   └── features/
│       ├── tabs/
│       │   └── tab-bar.tsx         # Tab bar with inline rename
│       │
│       ├── request-builder/
│       │   ├── request-builder.tsx  # Main request editor (method, URL, send)
│       │   ├── key-value-editor.tsx # Reusable key-value pair editor
│       │   └── auth-editor.tsx      # Auth config (Bearer, Basic, API Key)
│       │
│       ├── response-viewer/
│       │   └── response-viewer.tsx  # Response display (pretty JSON, raw, headers)
│       │
│       ├── sidebar/
│       │   ├── sidebar.tsx          # Sidebar shell (nav tabs + content)
│       │   └── collection-tree.tsx  # Collection/folder/request tree + standalone requests
│       │
│       ├── collections/
│       │   ├── collection-store.ts  # Collection CRUD (file-based persistence)
│       │   ├── saved-requests-store.ts  # Standalone request persistence
│       │   ├── new-request-tab.ts   # New tab: persist standalone + openRequestInTab (avoids store↔store cycle)
│       │   ├── rename-tab-persist.ts  # Tab title rename → sidebar + JSON on disk
│       │   └── save-request.ts      # Ctrl+S save logic (collection or standalone)
│       │
│       ├── environments/
│       │   ├── env-store.ts         # Environment CRUD with path-based store updates
│       │   ├── env-manager.tsx      # Environment list & variable editor
│       │   └── env-selector.tsx     # Titlebar environment dropdown
│       │
│       ├── history/
│       │   ├── history-store.ts     # History load/save/clear
│       │   └── history-panel.tsx    # History list grouped by date
│       │
│       └── command-palette/
│           └── command-palette.tsx   # Ctrl+K command palette (fuzzy search)
│
└── src-tauri/                       # Rust backend (Tauri v2)
    ├── Cargo.toml                   # Rust dependencies
    ├── tauri.conf.json              # Tauri app config (window, CSP, bundle)
    ├── capabilities/
    │   └── default.json             # Permissions (window, fs, shell)
    ├── .cargo/
    │   └── config.toml              # MSVC linker config (Windows-specific)
    ├── build.rs                     # Tauri build script
    └── src/
        ├── main.rs                  # Entry point (calls lib::run)
        ├── lib.rs                   # Plugin registration, command handler setup
        ├── commands/
        │   ├── mod.rs               # Module exports
        │   ├── http.rs              # send_request — HTTP client via reqwest
        │   └── storage.rs           # JSON file CRUD (read/write/delete/list)
        └── models/
            ├── mod.rs               # Module exports
            ├── request.rs           # HttpRequest, HttpResponse, RequestBody
            ├── collection.rs        # Collection, Folder, SavedRequest, Auth models
            └── environment.rs       # Environment, EnvironmentVariable
```

---

## 6. Key Data Types

### Frontend (`src/lib/types.ts`)

```typescript
// HTTP
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"
interface RequestConfig { method, url, headers: KeyValue[], queryParams: KeyValue[], body: RequestBody, auth: AuthConfig }
interface ResponseData { status, statusText, headers, body, durationMs, sizeBytes }

// Tabs
interface Tab { id, name, request: RequestConfig, response, isDirty, isLoading, savedLocation?: SavedLocation }
interface SavedLocation { type: "collection" | "standalone", collectionId?, folderId?, requestId }

// Collections
interface Collection { id, name, folders: CollectionFolder[], requests: SavedRequest[] }
interface SavedRequest { id, name, method, url, headers, queryParams, body, auth }

// Environments
interface Environment { id, name, variables: EnvironmentVariable[] }
interface EnvironmentVariable { key, value, enabled }

// History
interface RequestLog { id, timestamp, method, url, status, durationMs, request: RequestConfig }

// UI State
type SidebarView = "collections" | "history" | "environments"
type ThemeMode = "light" | "dark" | "system"
```

### Global Store (`src/store/app-store.ts`)

Tab helpers worth knowing:
- **`closeTabsForRequestId(requestId)`** — closes every tab whose `savedLocation.requestId` matches (used after deleting/removing a saved request).

```typescript
interface AppState {
  tabs: Tab[]              // Open request tabs
  activeTabId: string      // Currently focused tab (empty if none)
  collections: Collection[] // Saved collections (from JSON files)
  savedRequests: SavedRequest[] // Standalone saved requests
  environments: Environment[]
  activeEnvironmentId: string | null
  history: RequestLog[]    // Last 100 entries
  sidebarView: SidebarView
  sidebarWidth: number     // 200-400px
  theme: ThemeMode
}
```

---

## 7. Tauri Commands (Rust → Frontend IPC)

| Command | Signature | Purpose |
|---------|-----------|---------|
| `send_request` | `(request: HttpRequest) → HttpResponse` | Execute HTTP request via reqwest |
| `read_json_file` | `(relative_path: String) → String` | Read JSON from app data dir |
| `write_json_file` | `(relative_path: String, content: String) → ()` | Write JSON to app data dir |
| `delete_json_file` | `(relative_path: String) → ()` | Delete file from app data dir |
| `list_json_files` | `(relative_dir: String) → Vec<String>` | List files in a subdirectory |

---

## 8. Feature Details

### 8.1 Collections
- Each collection is a separate JSON file: `collections/<id>.json`
- Collections contain folders and requests
- Right-click on collection root: **New Request**, **Rename**, **New Folder** (Rename / New Folder not on folder rows)
- Hover on collection row: add-request, **rename (pencil)**, delete (delete uses modal if collection has folders/requests; empty collection deletes immediately)
- Inline collection rename commits with `renameCollection` (same pattern as folder name input)
- "+" on collection/folder header adds a request (persisted in collection; does not auto-open a tab)
- Requests opened from collections track their `savedLocation` so Ctrl+S updates them in-place

### 8.2 Standalone Saved Requests
- Stored in `saved-requests.json` as a flat array
- Appear under **Saved** above collections
- **New tab** (Ctrl+T, tab bar +, sidebar “New Request”, command palette, empty-state button) uses `createNewRequestTab()`: writes a new `SavedRequest` and opens a tab with `savedLocation: { type: "standalone", requestId }` — no extra Ctrl+S needed to appear in Saved
- Ctrl+S on an unsaved tab still creates/links standalone as before (`save-request.ts`)
- Rename (pencil), Move to collection (modal), Delete (confirm modal)
- `removeSavedRequest` and `removeRequestFromCollection` call **`closeTabsForRequestId`** so tabs pointing at that `requestId` close after removal

### 8.3 Modals & confirmations (collection-tree)
**Do not use `window.confirm`** for these flows; keep UX consistent with the existing overlay pattern.

Shared pattern:
- Outer: `fixed inset-0 z-[10040–10042] flex items-center justify-center bg-black/50 p-4`, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, click backdrop to dismiss
- Inner card: `max-w-md`, `rounded-lg border bg-popover`, `Escape` on keydown
- Footer: `Button` ghost **Cancel** + primary or **destructive** confirm

Implemented in `collection-tree.tsx` (signals, not a shared component yet):
| State | Purpose |
|--------|---------|
| `moveDialogRequest` | Pick collection/folder for standalone move |
| `pendingDeleteCollection` | Delete non-empty collection |
| `pendingRequestDestructive` | Remove request from collection **or** delete standalone saved request |

**Request delete/remove copy logic**
- Confirm **always** shown before delete/remove from sidebar
- `warnUnsaved` = open tab’s name + `request` fields differ from the sidebar `SavedRequest` snapshot (`JSON.stringify` compare of method, url, headers, queryParams, body, auth) — not only `tab.isDirty`
- If no unsaved diff but a tab is still open for that `requestId`, message adds that the open tab will be closed

### 8.4 Tab naming vs disk
- `tab-bar.tsx` commit rename calls **`renameTabAndPersist`** (`rename-tab-persist.ts`): updates tab title then `renameSavedRequest` or `renameRequestInCollection` so the sidebar and JSON files match without Ctrl+S

### 8.5 Response viewer (Body)
- **Pretty**: `JSON.stringify(JSON.parse(body), null, 2)` when valid JSON; else raw string; HTML via `highlightJson()` + `.pier-json-response` / `.hljs-*` theme in `globals.css` (dark, `data-theme="light"`, system)
- **Raw**: response body string only
- **Copy** (Body tab only): fixed top-right; copies Pretty formatted text or Raw body; short transition to check icon (`text-success`), then reset (~1.5s)

### 8.7 Environment Variable Interpolation
- Variables use `{{variableName}}` syntax
- Resolved at send-time by `variable-resolver.ts`
- Applied to: URL, headers, query params, body content, auth fields
- Active environment selected via titlebar dropdown

### 8.8 Theming
- CSS variables defined at `:root` level with dark as default
- `[data-theme="light"]` overrides for light mode
- `[data-theme="dark"]` overrides for explicit dark mode
- `@media (prefers-color-scheme: light)` applies when no `data-theme` attribute (system mode)
- Toggle via command palette: Theme: Dark / Light / System

### 8.9 Custom Titlebar
- `decorations: false` in Tauri config (no native title bar)
- Mouse drag initiates `appWindow.startDragging()` with 150ms delay
- Double-click on titlebar area triggers `appWindow.toggleMaximize()`
- Window control buttons: minimize, maximize/restore, close
- Titlebar contains: app logo, environment selector, command palette button

---

## 9. Known Issues & Technical Debt

| Issue | Details |
|-------|---------|
| `structuredClone` on SolidJS proxies | All instances replaced with `JSON.parse(JSON.stringify())` — watch for new occurrences |
| No nested `<button>` elements | SolidJS event delegation breaks with `<button>` inside `<button>` — use `<div>` for outer interactive containers |
| SolidJS store path-based updates | Environment variable editing uses `setState("environments", idx, "variables", varIdx, field, value)` for granular updates to avoid re-rendering inputs and losing focus |
| Windows linker config | `.cargo/config.toml` has hardcoded Windows SDK paths — won't work on other machines without modification |
| No error toasts | Storage/network errors are silently caught — needs user-visible error feedback |
| No loading states for save operations | Ctrl+S, collection operations have no visual feedback |
| History limit | Hardcoded to 100 entries, no pagination |
| CodeMirror not integrated | Request **body** editor is still plain; response **Pretty** uses read-only `highlight.js` only |
| Drag-and-drop partial | Standalone requests can be dragged into collections/folders; no reordering / collection-to-collection DnD |
| No import/export | No Postman/Insomnia/OpenAPI import capability |
| Icon regeneration | After editing `pier-logo.png`, run `tauri icon` and copy outputs into `public/` (commands in README) |

---

## 10. Development Commands

```bash
# Install dependencies
bun install

# Start development (frontend + Tauri)
bun run tauri dev

# Build for production
bun run tauri build

# Type check
./node_modules/.bin/tsc --noEmit

# Lint
bun run lint

# Format
bun run format

# Rust check only
cd src-tauri && cargo check
```

---

## 11. Roadmap / Not Yet Implemented

These features are described in `prd.md` but not yet built:

1. **Code editor integration** — CodeMirror 6 (or similar) for JSON **request** body editing; response Pretty already highlighted via `highlight.js`
2. **WebSocket support** — Real-time WebSocket client
3. **GraphQL support** — Query/mutation editor with schema introspection
4. **Request pre/post scripts** — JavaScript scripting engine
5. **Certificate management** — Custom CA certs, client certificates
6. **Proxy configuration** — HTTP/SOCKS proxy settings
7. **Cookie management** — Cookie jar with automatic handling
8. **Import/Export** — Postman, Insomnia, OpenAPI, cURL import
9. **Response search** — Find in response body
10. **Binary response handling** — Image preview, file download
11. **Request chaining** — Use response values in subsequent requests
12. **Team sharing** — Git-based collection sharing
13. **Plugin system** — Extensibility via plugins
14. **Performance profiling** — Request waterfall, timing breakdown
15. **Tests & CI/CD** — Unit tests, integration tests, GitHub Actions
16. **App icons** — Source: root `pier-logo.png`; see [Tauri icons](https://v2.tauri.app/develop/icons/)

---

## 12. Important Patterns & Conventions

### SolidJS Store Updates
- **Never use `structuredClone()`** on store objects (they are Proxies). Use `JSON.parse(JSON.stringify())`.
- **Never nest `<button>` inside `<button>`**. Use `<div>` with `cursor-pointer` for outer clickable containers.
- For granular updates that preserve input focus, use path-based `setState("path", index, "field", value)` instead of replacing the entire array.

### File Organization
- **Feature-based structure**: Each feature has its own directory under `src/features/`
- **Store files** (`*-store.ts`): Handle data persistence and state management
- **Component files** (`.tsx`): Handle UI rendering
- **Shared utilities** live in `src/lib/`
- **Reusable UI components** live in `src/components/ui/`

### Styling
- TailwindCSS v4 utility classes throughout
- CSS variables for theme colors (defined in `globals.css`)
- `cn()` utility (clsx + tailwind-merge) for conditional class names
- CVA (class-variance-authority) for component variants (Button)

### Rust Conventions
- All Tauri commands are `async` and return `Result<T, String>`
- Models use `serde::Serialize` + `Deserialize` with `rename_all = "camelCase"`
- File I/O goes through `app_data_dir()` — never direct filesystem paths

### New tab entry points (no `addTab` in app-store)
- **`createNewRequestTab`** lives in `src/features/collections/new-request-tab.ts` so `app-store` does not import `saved-requests-store` (would be circular).
- All “new request” UI must call this (or the same persistence + `openRequestInTab` pattern), not a bare in-memory tab without `savedLocation`.

### Future: shared confirm dialog
- Modals are duplicated in `collection-tree.tsx` today. New destructive flows should reuse the same layout (or extract a small `ConfirmDialog` component) instead of `window.confirm`.
