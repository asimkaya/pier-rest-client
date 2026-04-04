import { Show, For, createSignal, onMount, onCleanup } from "solid-js";
import { state, setActiveEnvironment } from "~/store/app-store";
import { cn } from "~/lib/utils";

export function EnvironmentSelector() {
  const [open, setOpen] = createSignal(false);
  let ref: HTMLDivElement | undefined;

  const activeEnv = () =>
    state.environments.find((e) => e.id === state.activeEnvironmentId);

  function handleClickOutside(e: MouseEvent) {
    if (ref && !ref.contains(e.target as Node)) {
      setOpen(false);
    }
  }

  onMount(() => document.addEventListener("mousedown", handleClickOutside));
  onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));

  function select(id: string | null) {
    setActiveEnvironment(id);
    setOpen(false);
  }

  return (
    <Show when={state.environments.length > 0}>
      <div ref={ref} class="relative" data-no-drag>
        <button
          class="flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] transition-colors hover:bg-accent"
          onClick={() => setOpen(!open())}
        >
          <span
            class={cn(
              "h-2 w-2 rounded-full",
              activeEnv() ? "bg-success" : "bg-muted-foreground/40"
            )}
          />
          <span class="text-foreground/80">
            {activeEnv()?.name ?? "No Environment"}
          </span>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted-foreground">
            <path d="M1 3l3 3 3-3" />
          </svg>
        </button>

        <Show when={open()}>
          <div class="absolute right-0 top-full z-50 mt-0.5 min-w-[160px] rounded-md border bg-popover py-1 shadow-lg animate-scale-in">
            <button
              class={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent",
                !state.activeEnvironmentId && "text-primary"
              )}
              onClick={() => select(null)}
            >
              <span class="h-2 w-2 rounded-full bg-muted-foreground/40" />
              No Environment
            </button>
            <For each={state.environments}>
              {(env) => (
                <button
                  class={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent",
                    state.activeEnvironmentId === env.id && "text-primary"
                  )}
                  onClick={() => select(env.id)}
                >
                  <span class="h-2 w-2 rounded-full bg-success" />
                  {env.name}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
