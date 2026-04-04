import { Show, For } from "solid-js";
import { state, setActiveEnvironment } from "~/store/app-store";
import { cn } from "~/lib/utils";

export function EnvironmentSelector() {
  const activeEnv = () =>
    state.environments.find((e) => e.id === state.activeEnvironmentId);

  return (
    <Show when={state.environments.length > 0}>
      <div class="relative group">
        <button class="flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] transition-colors hover:bg-accent">
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
        <div class="absolute right-0 top-full z-50 mt-1 hidden min-w-[160px] rounded-md border bg-popover py-1 shadow-lg group-hover:block">
          <button
            class={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent",
              !state.activeEnvironmentId && "text-primary"
            )}
            onClick={() => setActiveEnvironment(null)}
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
                onClick={() => setActiveEnvironment(env.id)}
              >
                <span class="h-2 w-2 rounded-full bg-success" />
                {env.name}
              </button>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
