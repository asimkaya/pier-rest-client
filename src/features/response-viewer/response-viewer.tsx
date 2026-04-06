import { createSignal, Show, For, createMemo, createEffect, onCleanup } from "solid-js";
import { getActiveTab } from "~/store/app-store";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { cn, formatBytes, formatDuration } from "~/lib/utils";
import { highlightJson } from "~/lib/json-highlight";

type ResponseTab = "body" | "headers";
type BodyView = "pretty" | "raw";
const SEARCH_MATCH_CLASS = "pier-search-match";
const ACTIVE_SEARCH_MATCH_CLASS = "pier-search-match-active";

function clearSearchHighlights(root: HTMLElement) {
  const marks = root.querySelectorAll(`mark.${SEARCH_MATCH_CLASS}`);
  for (const mark of marks) {
    const textNode = document.createTextNode(mark.textContent ?? "");
    mark.replaceWith(textNode);
  }
  root.normalize();
}

function applySearchHighlights(root: HTMLElement, query: string) {
  clearSearchHighlights(root);

  const needle = query.trim().toLowerCase();
  if (!needle) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(`mark.${SEARCH_MATCH_CLASS}`)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";
    const normalizedText = text.toLowerCase();
    let matchIndex = normalizedText.indexOf(needle);

    if (matchIndex === -1) continue;

    const fragment = document.createDocumentFragment();
    let cursor = 0;

    while (matchIndex !== -1) {
      if (matchIndex > cursor) {
        fragment.append(text.slice(cursor, matchIndex));
      }

      const mark = document.createElement("mark");
      mark.className = SEARCH_MATCH_CLASS;
      mark.textContent = text.slice(matchIndex, matchIndex + needle.length);
      fragment.append(mark);

      cursor = matchIndex + needle.length;
      matchIndex = normalizedText.indexOf(needle, cursor);
    }

    if (cursor < text.length) {
      fragment.append(text.slice(cursor));
    }

    textNode.replaceWith(fragment);
  }
}

function getSearchMatches(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll(`mark.${SEARCH_MATCH_CLASS}`));
}

export function ResponseViewer() {
  const [activeTab, setActiveTab] = createSignal<ResponseTab>("body");
  const [bodyView, setBodyView] = createSignal<BodyView>("pretty");
  const [copyBodyDone, setCopyBodyDone] = createSignal(false);
  const [searchOpen, setSearchOpen] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [searchMatchCount, setSearchMatchCount] = createSignal(0);
  const [activeSearchMatchIndex, setActiveSearchMatchIndex] = createSignal(-1);

  let copyBodyResetTimer: number | undefined;
  let searchInputRef: HTMLInputElement | undefined;
  let bodyContentRef: HTMLPreElement | undefined;

  const tab = () => getActiveTab();
  const response = () => tab()?.response;

  onCleanup(() => window.clearTimeout(copyBodyResetTimer));

  const formattedJsonBody = createMemo(() => {
    const body = response()?.body;
    if (!body) return "";
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  });

  const prettyJsonHtml = createMemo(() => highlightJson(formattedJsonBody()));

  function setActiveSearchMatch(nextIndex: number) {
    if (!bodyContentRef) {
      setSearchMatchCount(0);
      setActiveSearchMatchIndex(-1);
      return;
    }

    const matches = getSearchMatches(bodyContentRef);
    setSearchMatchCount(matches.length);

    for (const match of matches) {
      match.classList.remove(ACTIVE_SEARCH_MATCH_CLASS);
    }

    if (!matches.length) {
      setActiveSearchMatchIndex(-1);
      return;
    }

    const normalizedIndex = ((nextIndex % matches.length) + matches.length) % matches.length;
    const activeMatch = matches[normalizedIndex];
    activeMatch.classList.add(ACTIVE_SEARCH_MATCH_CLASS);
    activeMatch.scrollIntoView({ block: "nearest" });
    setActiveSearchMatchIndex(normalizedIndex);
  }

  function refreshSearchMatches(preferredIndex?: number) {
    if (!bodyContentRef || activeTab() !== "body") {
      setSearchMatchCount(0);
      setActiveSearchMatchIndex(-1);
      return;
    }

    const matches = getSearchMatches(bodyContentRef);
    if (!matches.length) {
      setSearchMatchCount(0);
      setActiveSearchMatchIndex(-1);
      return;
    }

    const fallbackIndex =
      preferredIndex !== undefined
        ? preferredIndex
        : activeSearchMatchIndex() >= 0
          ? activeSearchMatchIndex()
          : 0;

    setActiveSearchMatch(fallbackIndex);
  }

  createEffect(() => {
    if (!searchOpen()) return;
    queueMicrotask(() => searchInputRef?.focus());
  });

  createEffect(() => {
    response()?.body;
    bodyView();
    activeTab();
    const query = searchQuery();

    queueMicrotask(() => {
      if (!bodyContentRef || activeTab() !== "body") return;
      applySearchHighlights(bodyContentRef, query);
      refreshSearchMatches(query.trim() ? 0 : undefined);
    });
  });

  function bodyClipboardText(): string {
    if (bodyView() === "pretty") return formattedJsonBody();
    return response()!.body;
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  function openSearch() {
    setSearchOpen(true);
    queueMicrotask(() => searchInputRef?.focus());
  }

  function goToNextSearchMatch() {
    if (!searchMatchCount()) return;
    setActiveSearchMatch(activeSearchMatchIndex() + 1);
  }

  function goToPreviousSearchMatch() {
    if (!searchMatchCount()) return;
    setActiveSearchMatch(activeSearchMatchIndex() - 1);
  }

  async function copyResponseBody() {
    try {
      await navigator.clipboard.writeText(bodyClipboardText());
      setCopyBodyDone(true);
      window.clearTimeout(copyBodyResetTimer);
      copyBodyResetTimer = window.setTimeout(() => setCopyBodyDone(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function getStatusVariant(status: number) {
    if (status >= 200 && status < 300) return "success" as const;
    if (status >= 300 && status < 400) return "warning" as const;
    if (status >= 400) return "destructive" as const;
    return "secondary" as const;
  }

  return (
    <div class="flex h-full flex-col">
      <Show when={tab()?.isLoading}>
        <div class="flex flex-1 items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <svg class="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <p class="text-sm text-muted-foreground">Sending request...</p>
          </div>
        </div>
      </Show>

      <Show when={!tab()?.isLoading && !response()}>
        <div class="flex flex-1 items-center justify-center">
          <div class="flex flex-col items-center gap-3 text-center">
            <img
              src="/apple-touch-icon.png"
              alt=""
              width={48}
              height={48}
              class="opacity-40"
              draggable={false}
              aria-hidden="true"
            />
            <div>
              <p class="text-sm font-medium text-muted-foreground">No response yet</p>
              <p class="mt-1 text-xs text-muted-foreground/60">
                Enter a URL and click Send or press Ctrl+Enter
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={!tab()?.isLoading && response()}>
        {/* Response Meta */}
        <div class="flex items-center gap-3 border-b px-3 py-2">
          <Badge variant={getStatusVariant(response()!.status)}>
            {response()!.status} {response()!.statusText}
          </Badge>
          <span class="text-xs text-muted-foreground">
            {formatDuration(response()!.durationMs)}
          </span>
          <span class="text-xs text-muted-foreground">
            {formatBytes(response()!.sizeBytes)}
          </span>
        </div>

        {/* Response Tabs */}
        <div class="flex items-center border-b px-2">
          <button
            type="button"
            class={cn(
              "relative px-3 py-2 text-xs font-medium transition-colors duration-200 ease-out",
              activeTab() === "body" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("body")}
          >
            Body
            {activeTab() === "body" && <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            type="button"
            class={cn(
              "relative px-3 py-2 text-xs font-medium transition-colors duration-200 ease-out",
              activeTab() === "headers" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("headers")}
          >
            Headers
            <span class="ml-1 text-[10px] text-muted-foreground">
              ({Object.keys(response()!.headers).length})
            </span>
            {activeTab() === "headers" && <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <Show when={activeTab() === "body"}>
            <div class="ml-auto flex gap-0.5">
              <button
                type="button"
                class={cn(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors duration-200 ease-out",
                  bodyView() === "pretty" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setBodyView("pretty")}
              >
                Pretty
              </button>
              <button
                type="button"
                class={cn(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors duration-200 ease-out",
                  bodyView() === "raw" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setBodyView("raw")}
              >
                Raw
              </button>
            </div>
          </Show>
        </div>

        <div class="min-h-0 flex-1 overflow-hidden">
          <Show when={activeTab() === "body"}>
            <div class="flex h-full min-h-0 flex-col">
              <div class="shrink-0 border-b border-border/60 bg-background/95 px-2 py-2 backdrop-blur-sm">
                <div class="flex min-w-0 items-center justify-end gap-2">
                  <div
                    class={cn(
                      "flex min-w-0 items-center gap-1 overflow-hidden rounded-md border bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-200 ease-out",
                      searchOpen()
                        ? "w-full max-w-104 flex-1 border-border px-1.5 opacity-100"
                        : "w-0 max-w-0 flex-none border-transparent px-0 opacity-0 pointer-events-none"
                    )}
                  >
                    <Input
                      ref={(el) => {
                        searchInputRef = el;
                      }}
                      value={searchQuery()}
                      onInput={(e) => setSearchQuery(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (e.shiftKey) {
                            goToPreviousSearchMatch();
                          } else {
                            goToNextSearchMatch();
                          }
                        }

                        if (e.key === "Escape") {
                          e.preventDefault();
                          closeSearch();
                        }
                      }}
                      placeholder="Search body"
                      class="h-8 min-w-0 flex-1 border-0 bg-transparent px-2 text-xs shadow-none focus-visible:ring-0"
                      aria-label="Search response body"
                    />
                    <span class="min-w-12 shrink-0 text-center text-[10px] font-medium text-muted-foreground">
                      {searchMatchCount()
                        ? `${activeSearchMatchIndex() + 1}/${searchMatchCount()}`
                        : "0/0"}
                    </span>
                    <button
                      type="button"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={goToPreviousSearchMatch}
                      disabled={!searchMatchCount()}
                      aria-label="Previous search match"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={goToNextSearchMatch}
                      disabled={!searchMatchCount()}
                      aria-label="Next search match"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onClick={closeSearch}
                      aria-label="Close response search"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    class={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                    onClick={openSearch}
                    aria-label="Search response body"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class={cn(
                      "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                    onClick={() => void copyResponseBody()}
                    aria-label={copyBodyDone() ? "Copied" : "Copy response body"}
                  >
                    <span
                      class={cn(
                        "absolute flex items-center justify-center transition-all duration-200 ease-out",
                        copyBodyDone() ? "scale-50 opacity-0" : "scale-100 opacity-100"
                      )}
                      aria-hidden="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </span>
                    <span
                      class={cn(
                        "absolute flex items-center justify-center text-success transition-all duration-200 ease-out",
                        copyBodyDone() ? "scale-100 opacity-100" : "scale-50 opacity-0"
                      )}
                      aria-hidden="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              <div class="min-h-0 flex-1 overflow-auto">
                <Show
                  when={bodyView() === "pretty"}
                  fallback={
                    <pre
                      ref={bodyContentRef}
                      class="pier-tab-panel-in p-3 font-mono text-xs leading-relaxed text-foreground/90 select-text whitespace-pre-wrap break-all"
                    >
                      {response()!.body}
                    </pre>
                  }
                >
                  <pre
                    ref={bodyContentRef}
                    class="pier-json-response pier-tab-panel-in p-3 font-mono text-xs leading-relaxed select-text whitespace-pre-wrap break-all"
                  >
                    <code class="language-json hljs" innerHTML={prettyJsonHtml()} />
                  </pre>
                </Show>
              </div>
            </div>
          </Show>

          <Show when={activeTab() === "headers"}>
            <div class="h-full overflow-auto">
              <div class="pier-tab-panel-in p-2">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="border-b text-left text-muted-foreground">
                      <th class="px-2 py-1.5 font-medium">Name</th>
                      <th class="px-2 py-1.5 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={Object.entries(response()!.headers)}>
                      {([key, value]) => (
                        <tr class="border-b border-border/50 hover:bg-muted/30">
                          <td class="px-2 py-1.5 font-mono font-semibold text-primary/80 select-text">{key}</td>
                          <td class="px-2 py-1.5 font-mono text-foreground/80 select-text break-all">{value}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
