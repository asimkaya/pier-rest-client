import { createSignal, Show, For, onMount, onCleanup } from "solid-js";
import { Input } from "~/components/ui/input";
import { addTab, setSidebarView } from "~/store/app-store";
import { cn } from "~/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

const commands: CommandItem[] = [
  { id: "new-request", label: "New Request", shortcut: "Ctrl+T", action: () => addTab() },
  { id: "view-collections", label: "View Collections", action: () => setSidebarView("collections") },
  { id: "view-history", label: "View History", action: () => setSidebarView("history") },
  { id: "view-environments", label: "View Environments", action: () => setSidebarView("environments") },
];

export function CommandPalette() {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const filtered = () => {
    const q = query().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  };

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
        class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
        onClick={() => setOpen(false)}
      >
        <div
          class="w-[500px] rounded-lg border bg-popover shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="flex items-center border-b px-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2 shrink-0 text-muted-foreground">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autofocus
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
                  <span>{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd class="ml-auto text-[10px] text-muted-foreground tracking-wide">
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
        </div>
      </div>
    </Show>
  );
}
