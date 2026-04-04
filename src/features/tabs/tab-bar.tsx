import { For } from "solid-js";
import { state, setActiveTab, closeTab, addTab } from "~/store/app-store";
import { cn, getMethodColor } from "~/lib/utils";

export function TabBar() {
  return (
    <div class="flex h-9 shrink-0 items-center border-b bg-card">
      <div class="flex flex-1 items-center overflow-x-auto">
        <For each={state.tabs}>
          {(tab) => (
            <div
              class={cn(
                "group flex h-9 min-w-[120px] max-w-[200px] cursor-default items-center gap-2 border-r px-3 text-xs transition-colors",
                state.activeTabId === tab.id
                  ? "bg-background text-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span class={cn("font-mono text-[10px] font-bold", getMethodColor(tab.request.method))}>
                {tab.request.method}
              </span>
              <span class="flex-1 truncate">{tab.name}</span>
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
      <button
        class="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        onClick={addTab}
        aria-label="New tab"
        title="New tab (Ctrl+T)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="7" y1="2" x2="7" y2="12" />
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
    </div>
  );
}
