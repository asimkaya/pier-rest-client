import { For } from "solid-js";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { KeyValue } from "~/lib/types";
import { generateId } from "~/lib/utils";

interface KeyValueEditorProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor(props: KeyValueEditorProps) {
  function updateItem(id: string, field: "key" | "value", val: string) {
    const updated = props.items.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    props.onChange(updated);
  }

  function toggleItem(id: string) {
    const updated = props.items.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    props.onChange(updated);
  }

  function removeItem(id: string) {
    props.onChange(props.items.filter((item) => item.id !== id));
  }

  function addItem() {
    props.onChange([...props.items, { id: generateId(), key: "", value: "", enabled: true }]);
  }

  return (
    <div class="space-y-1">
      <For each={props.items}>
        {(item) => (
          <div class="flex items-center gap-1">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => toggleItem(item.id)}
              class="h-3.5 w-3.5 shrink-0 rounded border-input accent-primary"
            />
            <Input
              value={item.key}
              onInput={(e) => updateItem(item.id, "key", e.currentTarget.value)}
              placeholder={props.keyPlaceholder ?? "Key"}
              class="h-7 flex-1 text-xs"
            />
            <Input
              value={item.value}
              onInput={(e) => updateItem(item.id, "value", e.currentTarget.value)}
              placeholder={props.valuePlaceholder ?? "Value"}
              class="h-7 flex-1 text-xs"
            />
            <button
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => removeItem(item.id)}
              aria-label="Remove"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
          </div>
        )}
      </For>
      <Button variant="ghost" size="sm" class="mt-1 text-xs text-muted-foreground" onClick={addItem}>
        + Add
      </Button>
    </div>
  );
}
