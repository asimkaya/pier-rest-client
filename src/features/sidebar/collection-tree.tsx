import { For, Show, createSignal } from "solid-js";
import { state, openRequestInTab } from "~/store/app-store";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  createCollection,
  deleteCollection,
  addFolderToCollection,
  removeRequestFromCollection,
  removeFolderFromCollection,
} from "~/features/collections/collection-store";
import { cn, getMethodColor } from "~/lib/utils";
import type { Collection, SavedRequest } from "~/lib/types";

export function CollectionTree() {
  const [newCollectionName, setNewCollectionName] = createSignal("");
  const [creating, setCreating] = createSignal(false);
  const [expandedIds, setExpandedIds] = createSignal<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    const name = newCollectionName().trim();
    if (!name) return;
    await createCollection(name);
    setNewCollectionName("");
    setCreating(false);
  }

  function openRequest(req: SavedRequest) {
    openRequestInTab(
      {
        method: req.method,
        url: req.url,
        headers: [...req.headers],
        queryParams: [...req.queryParams],
        body: { ...req.body },
        auth: { ...req.auth },
      },
      req.name
    );
  }

  return (
    <div class="space-y-1">
      <Show when={creating()}>
        <div class="flex gap-1 mb-2">
          <Input
            autofocus
            value={newCollectionName()}
            onInput={(e) => setNewCollectionName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Collection name"
            class="h-7 text-xs"
          />
          <Button size="sm" onClick={handleCreate}>
            Add
          </Button>
        </div>
      </Show>

      <Show
        when={state.collections.length > 0}
        fallback={
          <div class="flex flex-col items-center gap-2 py-8 text-center">
            <p class="text-xs text-muted-foreground">No collections yet</p>
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              New Collection
            </Button>
          </div>
        }
      >
        <div class="mb-2">
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start text-xs text-muted-foreground"
            onClick={() => setCreating(true)}
          >
            + New Collection
          </Button>
        </div>
        <For each={state.collections}>
          {(collection) => (
            <div class="space-y-0.5">
              <div
                class="group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent cursor-default"
                onClick={() => toggleExpanded(collection.id)}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class={cn(
                    "shrink-0 transition-transform",
                    expandedIds().has(collection.id) && "rotate-90"
                  )}
                >
                  <path d="M4 2l4 4-4 4" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span class="flex-1 truncate text-xs">{collection.name}</span>
                <button
                  class="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCollection(collection.id);
                  }}
                  aria-label="Delete collection"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="2" y1="2" x2="10" y2="10" />
                    <line x1="10" y1="2" x2="2" y2="10" />
                  </svg>
                </button>
              </div>

              <Show when={expandedIds().has(collection.id)}>
                <div class="ml-4 space-y-0.5">
                  <For each={collection.folders}>
                    {(folder) => (
                      <div class="space-y-0.5">
                        <div class="group flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent cursor-default"
                          onClick={() => toggleExpanded(folder.id)}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"
                            class={cn("shrink-0 transition-transform", expandedIds().has(folder.id) && "rotate-90")}
                          >
                            <path d="M4 2l4 4-4 4" />
                          </svg>
                          <span class="truncate">{folder.name}</span>
                        </div>
                        <Show when={expandedIds().has(folder.id)}>
                          <div class="ml-4">
                            <For each={folder.requests}>
                              {(req) => (
                                <button
                                  class="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-xs hover:bg-accent cursor-default"
                                  onClick={() => openRequest(req)}
                                >
                                  <span class={cn("font-mono text-[10px] font-bold", getMethodColor(req.method))}>
                                    {req.method}
                                  </span>
                                  <span class="truncate text-muted-foreground">{req.name}</span>
                                </button>
                              )}
                            </For>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                  <For each={collection.requests}>
                    {(req) => (
                      <button
                        class="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-xs hover:bg-accent cursor-default"
                        onClick={() => openRequest(req)}
                      >
                        <span class={cn("font-mono text-[10px] font-bold", getMethodColor(req.method))}>
                          {req.method}
                        </span>
                        <span class="truncate text-muted-foreground">{req.name}</span>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
