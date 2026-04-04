import { createSignal } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { EnvironmentSelector } from "~/features/environments/env-selector";

export function Titlebar() {
  const [isMaximized, setIsMaximized] = createSignal(false);
  const appWindow = getCurrentWindow();

  async function checkMaximized() {
    setIsMaximized(await appWindow.isMaximized());
  }

  appWindow.onResized(() => checkMaximized());
  checkMaximized();

  return (
    <div
      class="flex h-9 shrink-0 items-center justify-between border-b bg-background select-none"
      data-tauri-drag-region
    >
      <div class="flex items-center gap-2 pl-3" data-tauri-drag-region>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-primary">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
            stroke-linejoin="round"
          />
        </svg>
        <span class="text-xs font-semibold tracking-wide text-foreground/80" data-tauri-drag-region>
          Volt
        </span>
      </div>

      <div class="flex items-center gap-2" data-tauri-drag-region>
        <EnvironmentSelector />
        <kbd class="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl+K
        </kbd>
      </div>

      <div class="flex h-full">
        <button
          class="inline-flex h-full w-11 items-center justify-center text-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => appWindow.minimize()}
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
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
