import type { Component } from "solid-js";
import { onMount, createSignal, Show } from "solid-js";
import { Titlebar } from "~/components/layout/titlebar";
import { Sidebar } from "~/features/sidebar/sidebar";
import { TabBar } from "~/features/tabs/tab-bar";
import { RequestBuilder } from "~/features/request-builder/request-builder";
import { ResponseViewer } from "~/features/response-viewer/response-viewer";
import { CommandPalette } from "~/features/command-palette/command-palette";
import { useKeybindings } from "~/lib/keybindings";
import { state, setTheme, setSidebarWidth } from "~/store/app-store";
import { createNewRequestTab } from "~/features/collections/new-request-tab";
import { loadCollections } from "~/features/collections/collection-store";
import { loadEnvironments } from "~/features/environments/env-store";
import { loadHistory } from "~/features/history/history-store";
import { loadSavedRequests } from "~/features/collections/saved-requests-store";

const App: Component = () => {
  useKeybindings();
  const [panelRatio, setPanelRatio] = createSignal(50);
  let containerRef: HTMLDivElement | undefined;
  let mainLayoutRef: HTMLDivElement | undefined;
  let isDragging = false;
  let isDraggingSidebar = false;

  onMount(async () => {
    setTheme(state.theme);
    await Promise.allSettled([loadCollections(), loadSavedRequests(), loadEnvironments(), loadHistory()]);
  });

  function handleSplitterDown(e: MouseEvent) {
    isDragging = true;
    e.preventDefault();

    function onMove(ev: MouseEvent) {
      if (!isDragging || !containerRef) return;
      const rect = containerRef.getBoundingClientRect();
      const ratio = ((ev.clientX - rect.left) / rect.width) * 100;
      setPanelRatio(Math.max(25, Math.min(75, ratio)));
    }

    function onUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleSidebarSplitterDown(e: MouseEvent) {
    isDraggingSidebar = true;
    e.preventDefault();
    function onMove(ev: MouseEvent) {
      if (!isDraggingSidebar || !mainLayoutRef) return;
      const left = mainLayoutRef.getBoundingClientRect().left;
      setSidebarWidth(ev.clientX - left);
    }
    function onUp() {
      isDraggingSidebar = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div class="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Titlebar />

      <div ref={(el) => (mainLayoutRef = el ?? undefined)} class="flex min-h-0 flex-1 overflow-hidden">
        <div style={{ width: `${state.sidebarWidth}px` }} class="shrink-0 overflow-hidden">
          <Sidebar />
        </div>

        <div
          class="flex w-1 shrink-0 cursor-col-resize items-center justify-center transition-colors hover:bg-primary/20 active:bg-primary/30"
          onMouseDown={handleSidebarSplitterDown}
        >
          <div class="h-8 w-0.5 rounded-full bg-border" />
        </div>

        <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TabBar />

          <Show
            when={state.tabs.length > 0}
            fallback={
              <div class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="text-muted-foreground/30">
                  <path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    fill="currentColor"
                    stroke="currentColor"
                    stroke-width="1"
                    stroke-linejoin="round"
                  />
                </svg>
                <div class="space-y-1">
                  <p class="text-sm text-muted-foreground">No open requests</p>
                  <p class="text-xs text-muted-foreground/60">
                    Create a new request or open one from your collections
                  </p>
                </div>
                <button
                  class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={() => void createNewRequestTab()}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="7" y1="2" x2="7" y2="12" />
                    <line x1="2" y1="7" x2="12" y2="7" />
                  </svg>
                  New Request
                </button>
              </div>
            }
          >
            <div ref={containerRef} class="flex flex-1 overflow-hidden">
              <div style={{ width: `${panelRatio()}%` }} class="overflow-hidden border-r">
                <RequestBuilder />
              </div>

              <div
                class="flex w-1 shrink-0 cursor-col-resize items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors"
                onMouseDown={handleSplitterDown}
              >
                <div class="h-8 w-0.5 rounded-full bg-border" />
              </div>

              <div style={{ width: `${100 - panelRatio()}%` }} class="overflow-hidden">
                <ResponseViewer />
              </div>
            </div>
          </Show>
        </div>
      </div>

      <CommandPalette />
    </div>
  );
};

export default App;
