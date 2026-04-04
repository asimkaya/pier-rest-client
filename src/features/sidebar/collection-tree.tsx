import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { state, openRequestInTab, getActiveTab } from "~/store/app-store";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  createCollection,
  deleteCollection,
  addFolderToCollection,
  addRequestToCollection,
  removeRequestFromCollection,
  removeFolderFromCollection,
  savedRequestFromTab,
} from "~/features/collections/collection-store";
import { cn, getMethodColor, generateId } from "~/lib/utils";
import type { Collection, SavedRequest } from "~/lib/types";
import { createDefaultRequest } from "~/lib/types";

interface ContextMenu {
  x: number;
  y: number;
  collectionId: string;
  folderId: string | null;
}

export function CollectionTree() {
  const [newCollectionName, setNewCollectionName] = createSignal("");
  const [creating, setCreating] = createSignal(false);
  const [expandedIds, setExpandedIds] = createSignal<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = createSignal<ContextMenu | null>(null);
  const [savingTo, setSavingTo] = createSignal<{ collectionId: string; folderId: string | null } | null>(null);
  const [requestName, setRequestName] = createSignal("");
  const [creatingFolder, setCreatingFolder] = createSignal<string | null>(null);
  const [folderName, setFolderName] = createSignal("");

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function ensureExpanded(id: string) {
    setExpandedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
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

  function handleContextMenu(e: MouseEvent, collectionId: string, folderId: string | null = null) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, collectionId, folderId });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  async function handleNewRequestInCollection(collectionId: string, folderId: string | null) {
    closeContextMenu();
    setSavingTo({ collectionId, folderId });
    setRequestName("New Request");
  }

  async function handleSaveActiveRequest(collectionId: string, folderId: string | null) {
    closeContextMenu();
    const tab = getActiveTab();
    if (!tab || !tab.request.url) {
      handleNewRequestInCollection(collectionId, folderId);
      return;
    }
    setSavingTo({ collectionId, folderId });
    setRequestName(tab.name || tab.request.url || "New Request");
  }

  async function confirmSaveRequest() {
    const target = savingTo();
    if (!target) return;
    const name = requestName().trim() || "Untitled";

    const tab = getActiveTab();
    let saved: SavedRequest;

    if (tab && tab.request.url) {
      saved = savedRequestFromTab(name, tab.id)!;
      if (!saved) return;
    } else {
      const req = createDefaultRequest();
      saved = {
        id: generateId(),
        name,
        method: req.method,
        url: req.url,
        headers: req.headers as any,
        queryParams: req.queryParams as any,
        body: req.body,
        auth: req.auth,
      };
    }

    await addRequestToCollection(target.collectionId, target.folderId, saved);
    ensureExpanded(target.collectionId);
    setSavingTo(null);
    setRequestName("");
  }

  function handleDocumentClick() {
    closeContextMenu();
  }

  onMount(() => document.addEventListener("click", handleDocumentClick));
  onCleanup(() => document.removeEventListener("click", handleDocumentClick));

  return (
    <div class="space-y-1">
      {/* Save request dialog */}
      <Show when={savingTo()}>
        <div class="mb-2 rounded-md border bg-card p-2 space-y-2 animate-scale-in">
          <p class="text-[10px] text-muted-foreground">Save request to collection</p>
          <Input
            autofocus
            value={requestName()}
            onInput={(e) => setRequestName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmSaveRequest();
              if (e.key === "Escape") { setSavingTo(null); setRequestName(""); }
            }}
            placeholder="Request name"
            class="h-7 text-xs"
          />
          <div class="flex gap-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setSavingTo(null); setRequestName(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmSaveRequest}>
              Save
            </Button>
          </div>
        </div>
      </Show>

      <Show when={creatingFolder()}>
        <div class="mb-2 rounded-md border bg-card p-2 space-y-2 animate-scale-in">
          <p class="text-[10px] text-muted-foreground">New folder</p>
          <Input
            autofocus
            value={folderName()}
            onInput={(e) => setFolderName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const name = folderName().trim();
                const colId = creatingFolder();
                if (name && colId) {
                  addFolderToCollection(colId, name);
                  ensureExpanded(colId);
                }
                setCreatingFolder(null);
                setFolderName("");
              }
              if (e.key === "Escape") { setCreatingFolder(null); setFolderName(""); }
            }}
            placeholder="Folder name"
            class="h-7 text-xs"
          />
          <div class="flex gap-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setCreatingFolder(null); setFolderName(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => {
              const name = folderName().trim();
              const colId = creatingFolder();
              if (name && colId) {
                addFolderToCollection(colId, name);
                ensureExpanded(colId);
              }
              setCreatingFolder(null);
              setFolderName("");
            }}>
              Create
            </Button>
          </div>
        </div>
      </Show>

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
                class="group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent cursor-pointer"
                onClick={() => toggleExpanded(collection.id)}
                onContextMenu={(e) => handleContextMenu(e, collection.id)}
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
                {/* Quick add request button */}
                <button
                  class="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveActiveRequest(collection.id, null);
                  }}
                  aria-label="Add request to collection"
                  title="Save active request"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="6" y1="2" x2="6" y2="10" />
                    <line x1="2" y1="6" x2="10" y2="6" />
                  </svg>
                </button>
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
                        <div
                          class="group flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent cursor-pointer"
                          onClick={() => toggleExpanded(folder.id)}
                          onContextMenu={(e) => handleContextMenu(e, collection.id, folder.id)}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"
                            class={cn("shrink-0 transition-transform", expandedIds().has(folder.id) && "rotate-90")}
                          >
                            <path d="M4 2l4 4-4 4" />
                          </svg>
                          <span class="flex-1 truncate">{folder.name}</span>
                          <button
                            class="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveActiveRequest(collection.id, folder.id);
                            }}
                            aria-label="Add request to folder"
                            title="Save active request"
                          >
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                              <line x1="6" y1="2" x2="6" y2="10" />
                              <line x1="2" y1="6" x2="10" y2="6" />
                            </svg>
                          </button>
                        </div>
                        <Show when={expandedIds().has(folder.id)}>
                          <div class="ml-4">
                            <For each={folder.requests}>
                              {(req) => (
                                <button
                                  class="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-xs hover:bg-accent"
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
                        class="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-xs hover:bg-accent"
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

      {/* Context menu */}
      <Show when={contextMenu()}>
        {(menu) => (
          <div
            class="fixed z-100 min-w-[160px] rounded-md border bg-popover py-1 shadow-lg animate-scale-in"
            style={{ left: `${menu().x}px`, top: `${menu().y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              class="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent"
              onClick={() => handleSaveActiveRequest(menu().collectionId, menu().folderId)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Active Request Here
            </button>
            <button
              class="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent"
              onClick={() => handleNewRequestInCollection(menu().collectionId, menu().folderId)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="6" y1="2" x2="6" y2="10" />
                <line x1="2" y1="6" x2="10" y2="6" />
              </svg>
              New Empty Request
            </button>
            <Show when={!menu().folderId}>
              <button
                class="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                onClick={() => {
                  setCreatingFolder(menu().collectionId);
                  setFolderName("");
                  closeContextMenu();
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                New Folder
              </button>
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}
