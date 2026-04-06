import { createSignal, Show, For, onMount, onCleanup, createMemo } from "solid-js";
import { setSidebarView, closeTab, getActiveTab, state, setTheme, setActiveEnvironment } from "~/store/app-store";
import { createNewRequestTab } from "~/features/collections/new-request-tab";
import { clearHistory } from "~/features/history/history-store";
import {
  exportWorkspaceViaDialog,
  importWorkspaceViaDialog,
  openCurlImportModal,
} from "~/features/import-export/import-export-store";
import { cn } from "~/lib/utils";
import type { ThemeMode } from "~/lib/types";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void | Promise<void>;
}

function buildCommands(): CommandItem[] {
  const commands: CommandItem[] = [
    { id: "new-request", label: "New Request", category: "General", shortcut: "Ctrl+T", action: () => void createNewRequestTab() },
    {
      id: "close-tab",
      label: "Close Current Tab",
      category: "General",
      action: () => {
        const t = getActiveTab();
        if (t) closeTab(t.id);
      },
    },
    { id: "view-collections", label: "View Collections", category: "Navigation", action: () => setSidebarView("collections") },
    { id: "view-history", label: "View History", category: "Navigation", action: () => setSidebarView("history") },
    { id: "view-environments", label: "View Environments", category: "Navigation", action: () => setSidebarView("environments") },
    { id: "clear-history", label: "Clear History", category: "Data", action: () => clearHistory() },
    { id: "export-workspace", label: "Export Workspace", category: "Data", action: () => void exportWorkspaceViaDialog() },
    { id: "import-workspace", label: "Import Workspace", category: "Data", action: () => void importWorkspaceViaDialog() },
    { id: "import-curl", label: "Import cURL", category: "Data", action: () => openCurlImportModal() },
    { id: "theme-system", label: "Theme: System", category: "Appearance", action: () => setTheme("system" as ThemeMode) },
    { id: "theme-dark", label: "Theme: Dark", category: "Appearance", action: () => setTheme("dark" as ThemeMode) },
    { id: "theme-light", label: "Theme: Light", category: "Appearance", action: () => setTheme("light" as ThemeMode) },
  ];

  for (const env of state.environments) {
    commands.push({
      id: `env-${env.id}`,
      label: `Switch to: ${env.name}`,
      category: "Environments",
      action: () => setActiveEnvironment(env.id),
    });
  }

  return commands;
}

export function CommandPalette() {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const commands = createMemo(() => buildCommands());

  const filtered = createMemo(() => {
    const q = query().toLowerCase();
    if (!q) return commands();
    return commands().filter(
      (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  });

  function execute(cmd: CommandItem) {
    cmd.action();
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setOpen(!open());
      setQuery("");
      setSelectedIndex(0);
      return;
    }

    if (!open()) return;

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered().length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered()[selectedIndex()];
      if (item) execute(item);
    }
  }

  onMount(() => document.addEventListener("keydown", handleKeyDown));
  onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

  return (
    <Show when={open()}>
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 animate-fade-in"
        onClick={() => setOpen(false)}
      >
        <div
          class="w-[500px] rounded-lg border bg-popover shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="flex items-center border-b px-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2 shrink-0 text-muted-foreground">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={(el) => {
                requestAnimationFrame(() => el.focus());
              }}
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command..."
              class="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div class="max-h-[300px] overflow-y-auto p-1">
            <For each={filtered()}>
              {(cmd, i) => (
                <button
                  class={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    selectedIndex() === i()
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => execute(cmd)}
                  onMouseEnter={() => setSelectedIndex(i())}
                >
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-muted-foreground w-20 text-left">{cmd.category}</span>
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <kbd class="text-[10px] text-muted-foreground tracking-wide">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              )}
            </For>
            <Show when={filtered().length === 0}>
              <p class="py-4 text-center text-sm text-muted-foreground">No results found.</p>
            </Show>
          </div>
          <div class="border-t px-3 py-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>
              <kbd class="rounded border px-1">↑↓</kbd> navigate
            </span>
            <span>
              <kbd class="rounded border px-1">↵</kbd> select
            </span>
            <span>
              <kbd class="rounded border px-1">esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </Show>
  );
}
