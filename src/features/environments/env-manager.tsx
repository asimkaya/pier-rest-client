import { For, Show, createSignal } from "solid-js";
import { state, setActiveEnvironment } from "~/store/app-store";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  createEnvironment,
  deleteEnvironment,
  updateEnvironmentVariable,
  addVariableToEnvironment,
  removeVariableFromEnvironment,
} from "./env-store";
import { cn } from "~/lib/utils";

export function EnvironmentManager() {
  const [creating, setCreating] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [editingId, setEditingId] = createSignal<string | null>(null);

  async function handleCreate() {
    const name = newName().trim();
    if (!name) return;
    await createEnvironment(name);
    setNewName("");
    setCreating(false);
  }

  return (
    <div class="space-y-1">
      <Show when={creating()}>
        <div class="flex gap-1 mb-2">
          <Input
            autofocus
            value={newName()}
            onInput={(e) => setNewName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Environment name"
            class="h-7 text-xs"
          />
          <Button size="sm" onClick={handleCreate}>Add</Button>
        </div>
      </Show>

      <Show
        when={state.environments.length > 0}
        fallback={
          <div class="flex flex-col items-center gap-2 py-8 text-center">
            <p class="text-xs text-muted-foreground">No environments yet</p>
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              New Environment
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
            + New Environment
          </Button>
        </div>

        <For each={state.environments}>
          {(env) => (
            <div class="space-y-1">
              <div
                class={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                  state.activeEnvironmentId === env.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-foreground/80"
                )}
              >
                <button
                  class={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors cursor-pointer",
                    state.activeEnvironmentId === env.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  )}
                  onClick={() =>
                    setActiveEnvironment(
                      state.activeEnvironmentId === env.id ? null : env.id
                    )
                  }
                  aria-label={`Activate ${env.name}`}
                />
                <span
                  class="flex-1 truncate cursor-pointer"
                  onClick={() => setEditingId(editingId() === env.id ? null : env.id)}
                >
                  {env.name}
                </span>
                <button
                  class="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
                  onClick={() => deleteEnvironment(env.id)}
                  aria-label="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="2" y1="2" x2="10" y2="10" />
                    <line x1="10" y1="2" x2="2" y2="10" />
                  </svg>
                </button>
              </div>

              <Show when={editingId() === env.id}>
                <div class="ml-4 space-y-1 pb-2">
                  <For each={env.variables}>
                    {(v, i) => (
                      <div class="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={v.enabled}
                          onChange={() => updateEnvironmentVariable(env.id, i(), "enabled", !v.enabled)}
                          class="h-3 w-3 shrink-0 accent-primary cursor-pointer"
                        />
                        <Input
                          value={v.key}
                          onInput={(e) => updateEnvironmentVariable(env.id, i(), "key", e.currentTarget.value)}
                          placeholder="KEY"
                          class="h-6 flex-1 text-[10px] font-mono"
                        />
                        <Input
                          value={v.value}
                          onInput={(e) => updateEnvironmentVariable(env.id, i(), "value", e.currentTarget.value)}
                          placeholder="value"
                          class="h-6 flex-1 text-[10px] font-mono"
                        />
                        <button
                          class="text-muted-foreground hover:text-destructive cursor-pointer"
                          onClick={() => removeVariableFromEnvironment(env.id, i())}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                            <line x1="2" y1="2" x2="10" y2="10" />
                            <line x1="10" y1="2" x2="2" y2="10" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </For>
                  <Button variant="ghost" size="sm" class="text-[10px] text-muted-foreground" onClick={() => addVariableToEnvironment(env.id)}>
                    + Add Variable
                  </Button>
                </div>
              </Show>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
