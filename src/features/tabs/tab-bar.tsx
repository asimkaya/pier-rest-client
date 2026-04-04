import { For, Show, createSignal } from "solid-js";
import { state, setActiveTab, closeTab, addTab, renameTab } from "~/store/app-store";
import { cn, getMethodColor } from "~/lib/utils";
import { Tooltip } from "~/components/ui/tooltip";

export function TabBar() {
  const [editingTabId, setEditingTabId] = createSignal<string | null>(null);
  const [editValue, setEditValue] = createSignal("");

  function startRename(tabId: string, currentName: string, e: MouseEvent) {
    e.stopPropagation();
    setEditingTabId(tabId);
    setEditValue(currentName);
  }

  function commitRename() {
    const id = editingTabId();
    const name = editValue().trim();
    if (id && name) {
      renameTab(id, name);
    }
    setEditingTabId(null);
    setEditValue("");
  }

  function cancelRename() {
    setEditingTabId(null);
    setEditValue("");
  }

  return (
    <div class="flex h-9 shrink-0 items-center border-b bg-card">
      <div class="flex flex-1 items-center overflow-x-auto">
        <For each={state.tabs}>
          {(tab) => (
            <div
              class={cn(
                "group flex h-9 min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 border-r px-3 text-xs transition-colors",
                state.activeTabId === tab.id
                  ? "bg-background text-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span class={cn("font-mono text-[10px] font-bold shrink-0", getMethodColor(tab.request.method))}>
                {tab.request.method}
              </span>

              <Show
                when={editingTabId() === tab.id}
                fallback={
                  <span
                    class="flex-1 truncate cursor-text"
                    onClick={(e) => {
                      if (state.activeTabId === tab.id) {
                        startRename(tab.id, tab.name, e);
                      }
                    }}
                  >
                    {tab.name}
                  </span>
                }
              >
                <input
                  ref={(el) => {
                    requestAnimationFrame(() => {
                      el.focus();
                      el.select();
                    });
                  }}
                  value={editValue()}
                  onInput={(e) => setEditValue(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  onBlur={() => commitRename()}
                  onClick={(e) => e.stopPropagation()}
                  class="h-5 w-full min-w-0 flex-1 rounded border bg-background px-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </Show>

              {tab.isDirty && (
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              )}
              <button
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label={`Close ${tab.name}`}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5">
                  <line x1="1" y1="1" x2="7" y2="7" />
                  <line x1="7" y1="1" x2="1" y2="7" />
                </svg>
              </button>
            </div>
          )}
        </For>
      </div>
      <Tooltip label="New tab (Ctrl+T)" placement="bottom" triggerClass="shrink-0">
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={addTab}
          aria-label="New tab"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="7" y1="2" x2="7" y2="12" />
            <line x1="2" y1="7" x2="12" y2="7" />
          </svg>
        </button>
      </Tooltip>
    </div>
  );
}
