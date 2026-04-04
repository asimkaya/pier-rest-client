import { onCleanup, onMount } from "solid-js";
import { addTab, closeTab, getActiveTab } from "~/store/app-store";
import { saveActiveRequest } from "~/features/collections/save-request";

interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

const bindings: KeyBinding[] = [
  { key: "t", ctrl: true, action: () => addTab(), description: "New tab" },
  {
    key: "w",
    ctrl: true,
    action: () => {
      const tab = getActiveTab();
      if (tab) closeTab(tab.id);
    },
    description: "Close tab",
  },
  {
    key: "s",
    ctrl: true,
    action: () => saveActiveRequest(),
    description: "Save request",
  },
];

export function useKeybindings(extra?: KeyBinding[]) {
  function handler(e: KeyboardEvent) {
    const allBindings = [...bindings, ...(extra ?? [])];
    for (const b of allBindings) {
      const ctrlMatch = b.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = b.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = b.alt ? e.altKey : !e.altKey;

      if (e.key.toLowerCase() === b.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        b.action();
        return;
      }
    }
  }

  onMount(() => document.addEventListener("keydown", handler));
  onCleanup(() => document.removeEventListener("keydown", handler));
}
