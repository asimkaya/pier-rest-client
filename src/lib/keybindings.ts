import { onCleanup, onMount } from "solid-js";
import { closeTab, getActiveTab } from "~/store/app-store";
import { createNewRequestTab } from "~/features/collections/new-request-tab";
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
  { key: "t", ctrl: true, action: () => void createNewRequestTab(), description: "New tab" },
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

function keyMatches(e: KeyboardEvent, expected: string): boolean {
  const exp = expected.toLowerCase();
  if (e.key.toLowerCase() === exp) return true;
  if (exp.length === 1 && exp >= "a" && exp <= "z" && e.code === `Key${exp.toUpperCase()}`) return true;
  return false;
}

export function useKeybindings(extra?: KeyBinding[]) {
  function handler(e: KeyboardEvent) {
    const allBindings = [...bindings, ...(extra ?? [])];
    for (const b of allBindings) {
      const ctrlMatch = b.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = b.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = b.alt ? e.altKey : !e.altKey;

      if (keyMatches(e, b.key) && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        b.action();
        return;
      }
    }
  }

  onMount(() => document.addEventListener("keydown", handler, { capture: true }));
  onCleanup(() => document.removeEventListener("keydown", handler, { capture: true }));
}
