import type { Component } from "solid-js";
import { onMount, createSignal } from "solid-js";
import { Titlebar } from "~/components/layout/titlebar";
import { Sidebar } from "~/features/sidebar/sidebar";
import { TabBar } from "~/features/tabs/tab-bar";
import { RequestBuilder } from "~/features/request-builder/request-builder";
import { ResponseViewer } from "~/features/response-viewer/response-viewer";
import { CommandPalette } from "~/features/command-palette/command-palette";
import { useKeybindings } from "~/lib/keybindings";
import { state, setTheme } from "~/store/app-store";
import { loadCollections } from "~/features/collections/collection-store";
import { loadEnvironments } from "~/features/environments/env-store";
import { loadHistory } from "~/features/history/history-store";

const App: Component = () => {
  useKeybindings();
  const [panelRatio, setPanelRatio] = createSignal(50);
  let containerRef: HTMLDivElement | undefined;
  let isDragging = false;

  onMount(async () => {
    setTheme(state.theme);
    await Promise.allSettled([loadCollections(), loadEnvironments(), loadHistory()]);
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

  return (
    <div class="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Titlebar />

      <div class="flex flex-1 overflow-hidden">
        <div style={{ width: `${state.sidebarWidth}px` }} class="shrink-0 overflow-hidden">
          <Sidebar />
        </div>

        <div class="flex flex-1 flex-col overflow-hidden">
          <TabBar />

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
        </div>
      </div>

      <CommandPalette />
    </div>
  );
};

export default App;
