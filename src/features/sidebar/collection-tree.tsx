import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { state, openRequestInTab, retargetStandaloneSavedTabs } from "~/store/app-store";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tooltip } from "~/components/ui/tooltip";
import {
  createCollection,
  deleteCollection,
  addFolderToCollection,
  addRequestToCollection,
  removeRequestFromCollection,
  renameRequestInCollection,
} from "~/features/collections/collection-store";
import {
  removeSavedRequest,
  renameSavedRequest,
} from "~/features/collections/saved-requests-store";
import { cn, getMethodColor, generateId } from "~/lib/utils";
import type { SavedRequest } from "~/lib/types";
import { createDefaultRequest } from "~/lib/types";

interface ContextMenu {
  x: number;
  y: number;
  collectionId: string;
  folderId: string | null;
}

const DRAG_MIME = "application/vnd.volt.saved-request-id";

export function CollectionTree() {
  const [newCollectionName, setNewCollectionName] = createSignal("");
  const [creating, setCreating] = createSignal(false);
  const [expandedIds, setExpandedIds] = createSignal<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = createSignal<ContextMenu | null>(null);
  const [moveDialogRequest, setMoveDialogRequest] = createSignal<SavedRequest | null>(null);
  const [moveDialogSelectedKey, setMoveDialogSelectedKey] = createSignal<string | null>(null);
  const [draggingId, setDraggingId] = createSignal<string | null>(null);
  const [dropHighlight, setDropHighlight] = createSignal<string | null>(null);
  const [landedRequestId, setLandedRequestId] = createSignal<string | null>(null);
  const [renamingRequestId, setRenamingRequestId] = createSignal<string | null>(null);
  const [renameValue, setRenameValue] = createSignal("");
  const [renameContext, setRenameContext] = createSignal<{ collectionId?: string; folderId?: string | null; standalone?: boolean } | null>(null);
  const [creatingFolder, setCreatingFolder] = createSignal<string | null>(null);
  const [folderName, setFolderName] = createSignal("");

  let expandTimer: number | undefined;
  let lastExpandCol: string | null = null;

  function clearDragDecorations() {
    setDraggingId(null);
    setDropHighlight(null);
    lastExpandCol = null;
    window.clearTimeout(expandTimer);
  }

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

  async function handleCreateCollection() {
    const name = newCollectionName().trim();
    if (!name) return;
    await createCollection(name);
    setNewCollectionName("");
    setCreating(false);
  }

  function openSavedRequest(req: SavedRequest, collectionId?: string, folderId?: string) {
    openRequestInTab(
      {
        method: req.method,
        url: req.url,
        headers: [...req.headers],
        queryParams: [...req.queryParams],
        body: { ...req.body },
        auth: { ...req.auth },
      },
      req.name,
      collectionId
        ? { type: "collection", collectionId, folderId, requestId: req.id }
        : { type: "standalone", requestId: req.id }
    );
  }

  function handleContextMenu(e: MouseEvent, collectionId: string, folderId: string | null = null) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, collectionId, folderId });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  async function addNewRequestToCollection(collectionId: string, folderId: string | null) {
    closeContextMenu();
    const req = createDefaultRequest();
    const requestId = generateId();
    const saved: SavedRequest = {
      id: requestId,
      name: "New Request",
      method: req.method,
      url: req.url,
      headers: req.headers as any,
      queryParams: req.queryParams as any,
      body: req.body,
      auth: req.auth,
    };

    await addRequestToCollection(collectionId, folderId, saved);
    ensureExpanded(collectionId);
    if (folderId) ensureExpanded(folderId);

    setRenamingRequestId(requestId);
    setRenameValue("New Request");
    setRenameContext({ collectionId, folderId });
  }

  async function commitRename() {
    const reqId = renamingRequestId();
    const ctx = renameContext();
    const name = renameValue().trim();
    if (!reqId || !name) {
      cancelRename();
      return;
    }
    if (ctx?.standalone) {
      await renameSavedRequest(reqId, name);
    } else if (ctx?.collectionId) {
      await renameRequestInCollection(ctx.collectionId, reqId, name);
    }
    setRenamingRequestId(null);
    setRenameValue("");
    setRenameContext(null);
  }

  function cancelRename() {
    setRenamingRequestId(null);
    setRenameValue("");
    setRenameContext(null);
  }

  async function moveStandaloneToCollection(
    req: SavedRequest,
    collectionId: string,
    folderId: string | null = null
  ) {
    const saved: SavedRequest = JSON.parse(JSON.stringify(req));
    await addRequestToCollection(collectionId, folderId, saved);
    await removeSavedRequest(req.id);
    retargetStandaloneSavedTabs(req.id, {
      type: "collection",
      collectionId,
      folderId: folderId ?? undefined,
      requestId: req.id,
    });
    ensureExpanded(collectionId);
    if (folderId) ensureExpanded(folderId);
    setMoveDialogRequest(null);
    setMoveDialogSelectedKey(null);
    setLandedRequestId(req.id);
    window.setTimeout(() => setLandedRequestId(null), 2200);
    clearDragDecorations();
  }

  function parseMoveTarget(key: string): { collectionId: string; folderId: string | null } | null {
    if (key.startsWith("root:")) {
      return { collectionId: key.slice(5), folderId: null };
    }
    if (key.startsWith("folder:")) {
      const parts = key.split(":");
      if (parts.length >= 3) {
        return { collectionId: parts[1], folderId: parts.slice(2).join(":") };
      }
    }
    return null;
  }

  function openMoveDialog(req: SavedRequest) {
    setMoveDialogRequest(req);
    const first = state.collections[0];
    setMoveDialogSelectedKey(first ? `root:${first.id}` : null);
  }

  function handleDocumentClick() {
    closeContextMenu();
  }

  onMount(() => {
    document.addEventListener("click", handleDocumentClick);
    const onDragEnd = () => clearDragDecorations();
    document.addEventListener("dragend", onDragEnd);
    onCleanup(() => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("dragend", onDragEnd);
    });
  });

  function renderRenameInput(req: SavedRequest) {
    return (
      <div class="flex items-center gap-1 px-2 py-0.5">
        <span class={cn("font-mono text-[10px] font-bold shrink-0", getMethodColor(req.method))}>
          {req.method}
        </span>
        <input
          ref={(el) => {
            requestAnimationFrame(() => {
              el.focus();
              el.select();
            });
          }}
          value={renameValue()}
          onInput={(e) => setRenameValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") cancelRename();
          }}
          onBlur={() => commitRename()}
          class="h-5 flex-1 rounded border bg-background px-1 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    );
  }

  function renderCollectionRequest(req: SavedRequest, collectionId: string, folderId?: string) {
    if (renamingRequestId() === req.id) return renderRenameInput(req);

    return (
      <div
        class={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-xs hover:bg-accent group/req cursor-pointer",
          landedRequestId() === req.id && "request-land-enter drop-target-active"
        )}
        onClick={() => openSavedRequest(req, collectionId, folderId)}
      >
        <span class={cn("font-mono text-[10px] font-bold shrink-0", getMethodColor(req.method))}>
          {req.method}
        </span>
        <span class="flex-1 truncate text-muted-foreground text-left">{req.name}</span>
        <button
          class="shrink-0 opacity-0 group-hover/req:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            removeRequestFromCollection(collectionId, req.id);
          }}
          aria-label="Remove request"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
          </svg>
        </button>
      </div>
    );
  }

  async function handleDropToTarget(e: DragEvent, collectionId: string, folderId: string | null) {
    e.preventDefault();
    const id = e.dataTransfer?.getData(DRAG_MIME) ?? "";
    clearDragDecorations();
    if (!id) return;
    const req = state.savedRequests.find((r) => r.id === id);
    if (!req) return;
    await moveStandaloneToCollection(req, collectionId, folderId);
  }

  function onCollectionDragOver(e: DragEvent, collectionId: string) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt) return;
    dt.dropEffect = "move";
    setDropHighlight(`c:${collectionId}`);
    if (lastExpandCol !== collectionId) {
      lastExpandCol = collectionId;
      window.clearTimeout(expandTimer);
      expandTimer = window.setTimeout(() => ensureExpanded(collectionId), 200);
    }
  }

  function onFolderDragOver(e: DragEvent, collectionId: string, folderId: string) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt) return;
    dt.dropEffect = "move";
    setDropHighlight(`f:${collectionId}:${folderId}`);
    if (lastExpandCol !== collectionId) {
      lastExpandCol = collectionId;
      window.clearTimeout(expandTimer);
      expandTimer = window.setTimeout(() => {
        ensureExpanded(collectionId);
        ensureExpanded(folderId);
      }, 200);
    }
  }

  function renderStandaloneRequest(req: SavedRequest) {
    if (renamingRequestId() === req.id) return renderRenameInput(req);

    return (
      <div
        class={cn(
          "group/req flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-accent",
          draggingId() === req.id && "opacity-45"
        )}
      >
        <div
          class="shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            const dt = e.dataTransfer;
            if (!dt) return;
            dt.setData(DRAG_MIME, req.id);
            dt.effectAllowed = "move";
            setDraggingId(req.id);
          }}
          onDragEnd={() => clearDragDecorations()}
          aria-label="Drag into a collection or folder"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
            <circle cx="2.5" cy="2.5" r="1.2" />
            <circle cx="7.5" cy="2.5" r="1.2" />
            <circle cx="2.5" cy="7" r="1.2" />
            <circle cx="7.5" cy="7" r="1.2" />
            <circle cx="2.5" cy="11.5" r="1.2" />
            <circle cx="7.5" cy="11.5" r="1.2" />
          </svg>
        </div>
        <div
          class="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
          onClick={() => openSavedRequest(req)}
        >
          <span class={cn("font-mono text-[10px] font-bold shrink-0", getMethodColor(req.method))}>
            {req.method}
          </span>
          <span class="flex-1 truncate text-left text-muted-foreground">{req.name}</span>
        </div>
        <div class="flex shrink-0 items-center gap-0.5">
          <Tooltip label="Rename" placement="top">
            <button
              type="button"
              class="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/req:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setRenamingRequestId(req.id);
                setRenameValue(req.name);
                setRenameContext({ standalone: true });
              }}
              aria-label="Rename"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip label="Move to collection" placement="top">
            <button
              type="button"
              class="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-primary group-hover/req:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                queueMicrotask(() => openMoveDialog(req));
              }}
              aria-label="Move to collection"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip label="Delete" placement="top">
            <button
              type="button"
              class="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover/req:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                removeSavedRequest(req.id);
              }}
              aria-label="Delete"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-1">
      {/* Standalone saved requests */}
      <Show when={state.savedRequests.length > 0}>
        <div class="space-y-0.5 pb-2 mb-2 border-b">
          <p class="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Saved</p>
          <For each={state.savedRequests}>
            {(req) => renderStandaloneRequest(req)}
          </For>
        </div>
      </Show>

      <Show when={creatingFolder()}>
        <div class="mb-2 rounded-md border bg-card p-2 space-y-2 animate-scale-in">
          <p class="text-[10px] text-muted-foreground">New folder</p>
          <Input
            ref={(el) =>
              queueMicrotask(() => {
                try {
                  el.focus({ preventScroll: true });
                } catch {
                  /* ignore */
                }
              })
            }
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
            ref={(el) =>
              queueMicrotask(() => {
                try {
                  el.focus({ preventScroll: true });
                } catch {
                  /* ignore */
                }
              })
            }
            value={newCollectionName()}
            onInput={(e) => setNewCollectionName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateCollection();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Collection name"
            class="h-7 text-xs"
          />
          <Button size="sm" onClick={handleCreateCollection}>
            Add
          </Button>
        </div>
      </Show>

      <Show
        when={state.collections.length > 0 || state.savedRequests.length > 0}
        fallback={
          <Show when={state.savedRequests.length === 0}>
            <div class="flex flex-col items-center gap-2 py-8 text-center">
              <p class="text-xs text-muted-foreground">No collections yet</p>
              <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
                New Collection
              </Button>
            </div>
          </Show>
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
                class={cn(
                  "group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent cursor-pointer transition-[box-shadow,background-color] duration-150",
                  dropHighlight() === `c:${collection.id}` &&
                    "ring-2 ring-primary/50 bg-primary/5 drop-target-active"
                )}
                onClick={() => toggleExpanded(collection.id)}
                onContextMenu={(e) => handleContextMenu(e, collection.id)}
                onDragOver={(e) => onCollectionDragOver(e, collection.id)}
                onDragLeave={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && (e.currentTarget as HTMLElement).contains(next)) return;
                  setDropHighlight((h) => (h === `c:${collection.id}` ? null : h));
                }}
                onDrop={(e) => void handleDropToTarget(e, collection.id, null)}
              >
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"
                  class={cn("shrink-0 transition-transform", expandedIds().has(collection.id) && "rotate-90")}
                >
                  <path d="M4 2l4 4-4 4" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span class="flex-1 truncate text-xs">{collection.name}</span>
                <Tooltip label="New request" placement="top" triggerClass="shrink-0">
                  <button
                    type="button"
                    class="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNewRequestToCollection(collection.id, null);
                    }}
                    aria-label="Add request to collection"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                      <line x1="6" y1="2" x2="6" y2="10" />
                      <line x1="2" y1="6" x2="10" y2="6" />
                    </svg>
                  </button>
                </Tooltip>
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
                          class={cn(
                            "group flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent cursor-pointer transition-[box-shadow,background-color] duration-150",
                            dropHighlight() === `f:${collection.id}:${folder.id}` &&
                              "ring-2 ring-primary/50 bg-primary/5 drop-target-active"
                          )}
                          onClick={() => toggleExpanded(folder.id)}
                          onContextMenu={(e) => handleContextMenu(e, collection.id, folder.id)}
                          onDragOver={(e) => onFolderDragOver(e, collection.id, folder.id)}
                          onDragLeave={(e) => {
                            const next = e.relatedTarget as Node | null;
                            if (next && (e.currentTarget as HTMLElement).contains(next)) return;
                            setDropHighlight((h) => (h === `f:${collection.id}:${folder.id}` ? null : h));
                          }}
                          onDrop={(e) => void handleDropToTarget(e, collection.id, folder.id)}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"
                            class={cn("shrink-0 transition-transform", expandedIds().has(folder.id) && "rotate-90")}
                          >
                            <path d="M4 2l4 4-4 4" />
                          </svg>
                          <span class="flex-1 truncate">{folder.name}</span>
                          <Tooltip label="New request" placement="top" triggerClass="shrink-0">
                            <button
                              type="button"
                              class="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                addNewRequestToCollection(collection.id, folder.id);
                              }}
                              aria-label="Add request to folder"
                            >
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                                <line x1="6" y1="2" x2="6" y2="10" />
                                <line x1="2" y1="6" x2="10" y2="6" />
                              </svg>
                            </button>
                          </Tooltip>
                        </div>
                        <Show when={expandedIds().has(folder.id)}>
                          <div class="ml-4">
                            <For each={folder.requests}>
                              {(req) => renderCollectionRequest(req, collection.id, folder.id)}
                            </For>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                  <For each={collection.requests}>
                    {(req) => renderCollectionRequest(req, collection.id)}
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
              onClick={() => addNewRequestToCollection(menu().collectionId, menu().folderId)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="6" y1="2" x2="6" y2="10" />
                <line x1="2" y1="6" x2="10" y2="6" />
              </svg>
              New Request
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

      {/* Move to collection (modal) */}
      <Show when={moveDialogRequest()}>
        {(getReq) => {
          const req = () => getReq()!;
          return (
            <div
              class="fixed inset-0 z-[10040] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
              role="dialog"
              aria-modal="true"
              aria-labelledby="volt-move-dialog-title"
              onClick={() => {
                setMoveDialogRequest(null);
                setMoveDialogSelectedKey(null);
              }}
            >
              <div
                class="w-full max-w-md rounded-lg border border-border bg-popover p-4 shadow-xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setMoveDialogRequest(null);
                    setMoveDialogSelectedKey(null);
                  }
                }}
              >
                <h2 id="volt-move-dialog-title" class="text-sm font-semibold text-foreground">
                  Move request
                </h2>
                <p class="mt-1 truncate text-xs text-muted-foreground">“{req().name}”</p>
                <Show
                  when={state.collections.length > 0}
                  fallback={
                    <p class="mt-4 text-xs text-muted-foreground">Create a collection first, then try again.</p>
                  }
                >
                  <div class="mt-3 max-h-[50vh] space-y-1 overflow-y-auto rounded-md border border-border/80 bg-muted/20 p-1">
                    <For each={state.collections}>
                      {(col) => (
                        <div class="space-y-0.5">
                          <button
                            type="button"
                            class={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors",
                              moveDialogSelectedKey() === `root:${col.id}`
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/60"
                            )}
                            onClick={() => setMoveDialogSelectedKey(`root:${col.id}`)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 opacity-70">
                              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span class="min-w-0 flex-1 truncate font-medium">{col.name}</span>
                            <span class="shrink-0 text-[10px] text-muted-foreground">root</span>
                          </button>
                          <For each={col.folders}>
                            {(folder) => (
                              <button
                                type="button"
                                class={cn(
                                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 pl-6 text-left text-xs transition-colors",
                                  moveDialogSelectedKey() === `folder:${col.id}:${folder.id}`
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent/60"
                                )}
                                onClick={() => setMoveDialogSelectedKey(`folder:${col.id}:${folder.id}`)}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 opacity-60">
                                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span class="min-w-0 flex-1 truncate">
                                  {col.name}
                                  <span class="text-muted-foreground"> › </span>
                                  {folder.name}
                                </span>
                              </button>
                            )}
                          </For>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
                <div class="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMoveDialogRequest(null);
                      setMoveDialogSelectedKey(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!moveDialogSelectedKey() || state.collections.length === 0}
                    onClick={() => {
                      const key = moveDialogSelectedKey();
                      const r = req();
                      const parsed = key ? parseMoveTarget(key) : null;
                      if (!parsed) return;
                      void moveStandaloneToCollection(r, parsed.collectionId, parsed.folderId);
                    }}
                  >
                    Move here
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
}
