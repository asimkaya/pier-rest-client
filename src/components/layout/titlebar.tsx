import { createSignal, onMount, onCleanup } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { EnvironmentSelector } from "~/features/environments/env-selector";
import { Tooltip } from "~/components/ui/tooltip";

export function Titlebar() {
  const [isMaximized, setIsMaximized] = createSignal(false);
  const appWindow = getCurrentWindow();

  async function checkMaximized() {
    try {
      setIsMaximized(await appWindow.isMaximized());
    } catch {
      /* ignore */
    }
  }

  onMount(() => {
    void checkMaximized();
    const unlistenPromise = appWindow.onResized(() => {
      void checkMaximized();
    });
    onCleanup(() => {
      void unlistenPromise.then((unlisten) => unlisten());
    });
  });

  function openCommandPalette() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  }

  return (
    <div class="flex h-9 shrink-0 items-center border-b bg-background select-none">
      <div class="flex min-h-9 min-w-0 flex-1 items-center gap-2 pl-3" data-tauri-drag-region>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-primary">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
            stroke-linejoin="round"
          />
        </svg>
        <span class="text-xs font-semibold tracking-wide text-foreground/80">
          Pier
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-2" data-tauri-drag-region-exclude>
        <EnvironmentSelector />
        <Tooltip label="Command Palette (Ctrl+K)" placement="bottom" triggerClass="hidden sm:inline-flex">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={openCommandPalette}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>Ctrl+K</span>
          </button>
        </Tooltip>
      </div>

      <div class="flex h-full shrink-0" data-tauri-drag-region-exclude>
        <button
          type="button"
          class="inline-flex h-full w-11 items-center justify-center text-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => appWindow.minimize()}
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          type="button"
          class="inline-flex h-full w-11 items-center justify-center text-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => appWindow.toggleMaximize()}
          aria-label={isMaximized() ? "Restore" : "Maximize"}
        >
          {isMaximized() ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="2" y="0" width="8" height="8" rx="0.5" />
              <rect x="0" y="2" width="8" height="8" rx="0.5" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="0.5" y="0.5" width="9" height="9" rx="0.5" />
            </svg>
          )}
        </button>
        <button
          type="button"
          class="inline-flex h-full w-11 items-center justify-center text-foreground/60 hover:bg-destructive hover:text-white transition-colors"
          onClick={() => appWindow.close()}
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
