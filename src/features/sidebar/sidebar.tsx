import { For, Show } from "solid-js";
import { state, setSidebarView } from "~/store/app-store";
import { createNewRequestTab } from "~/features/collections/new-request-tab";
import { Button } from "~/components/ui/button";
import { CollectionTree } from "./collection-tree";
import { HistoryPanel } from "~/features/history/history-panel";
import { EnvironmentManager } from "~/features/environments/env-manager";
import type { SidebarView } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Tooltip } from "~/components/ui/tooltip";

const navItems: { id: SidebarView; label: string; icon: string }[] = [
  { id: "collections", label: "Collections", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { id: "history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "environments", label: "Env", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export function Sidebar() {
  return (
    <aside class="flex h-full flex-col border-r bg-card">
      <div class="flex items-center gap-1 border-b px-2 py-1.5">
        <For each={navItems}>
          {(item) => (
            <Tooltip label={item.label} placement="bottom" triggerClass="min-w-0 flex-1">
              <button
                type="button"
                class={cn(
                  "flex h-7 w-full min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all duration-200 ease-out",
                  state.sidebarView === item.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => setSidebarView(item.id)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                <span class="truncate">{item.label}</span>
              </button>
            </Tooltip>
          )}
        </For>
      </div>

      <div class="flex-1 overflow-y-auto p-2">
        <Show when={state.sidebarView === "collections"}>
          <div class="pier-tab-panel-in">
            <CollectionTree />
          </div>
        </Show>

        <Show when={state.sidebarView === "history"}>
          <div class="pier-tab-panel-in">
            <HistoryPanel />
          </div>
        </Show>

        <Show when={state.sidebarView === "environments"}>
          <div class="pier-tab-panel-in">
            <EnvironmentManager />
          </div>
        </Show>
      </div>

      <div class="border-t p-2">
        <Button variant="ghost" size="sm" class="w-full justify-start gap-2" onClick={() => void createNewRequestTab()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Request
        </Button>
      </div>
    </aside>
  );
}
