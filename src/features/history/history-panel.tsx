import { For, Show } from "solid-js";
import { state, openRequestInTab } from "~/store/app-store";
import { Button } from "~/components/ui/button";
import { clearHistory } from "./history-store";
import { cn, getMethodColor, formatDuration } from "~/lib/utils";
import type { RequestLog } from "~/lib/types";

export function HistoryPanel() {
  function openHistoryItem(entry: RequestLog) {
    openRequestInTab(entry.request, `${entry.method} ${new URL(entry.url).pathname}`);
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function groupedHistory() {
    const groups: { date: string; items: RequestLog[] }[] = [];
    for (const entry of state.history) {
      const date = formatDate(entry.timestamp);
      const existing = groups.find((g) => g.date === date);
      if (existing) {
        existing.items.push(entry);
      } else {
        groups.push({ date, items: [entry] });
      }
    }
    return groups;
  }

  return (
    <div class="space-y-1">
      <Show
        when={state.history.length > 0}
        fallback={
          <div class="py-8 text-center">
            <p class="text-xs text-muted-foreground">No history yet</p>
            <p class="mt-1 text-[10px] text-muted-foreground/60">
              Send a request to see it here
            </p>
          </div>
        }
      >
        <div class="flex items-center justify-between px-1 pb-1">
          <span class="text-[10px] text-muted-foreground">
            {state.history.length} requests
          </span>
          <Button
            variant="ghost"
            size="sm"
            class="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={clearHistory}
          >
            Clear
          </Button>
        </div>

        <For each={groupedHistory()}>
          {(group) => (
            <div>
              <div class="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {group.date}
              </div>
              <For each={group.items}>
                {(entry) => (
                  <button
                    class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                    onClick={() => openHistoryItem(entry)}
                  >
                    <span class={cn("w-10 shrink-0 font-mono text-[10px] font-bold text-left", getMethodColor(entry.method))}>
                      {entry.method}
                    </span>
                    <span class="flex-1 truncate text-left text-muted-foreground">{entry.url}</span>
                    <span class={cn(
                      "shrink-0 text-[10px]",
                      entry.status >= 200 && entry.status < 300 ? "text-success" :
                      entry.status >= 400 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {entry.status > 0 ? entry.status : "ERR"}
                    </span>
                    <span class="shrink-0 text-[10px] text-muted-foreground/60">
                      {formatTime(entry.timestamp)}
                    </span>
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
