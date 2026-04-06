import { Compartment, EditorState } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView, placeholder } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import { basicSetup } from "codemirror";
import { tags } from "@lezer/highlight";
import { createEffect, mergeProps, onCleanup, onMount } from "solid-js";
import { cn } from "~/lib/utils";

type CodeEditorLanguage = "json" | "plain";

interface CodeEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  language?: CodeEditorLanguage;
  placeholder?: string;
  class?: string;
  ariaLabel?: string;
}

const editorTheme = EditorView.theme({
  "&": {
    "background-color": "transparent",
    color: "var(--color-foreground)",
    "font-family": '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
    "font-size": "0.75rem",
    "line-height": "1.5",
  },
  ".cm-scroller": {
    overflow: "auto",
    "font-family": "inherit",
  },
  ".cm-content": {
    padding: "0.75rem",
    "min-height": "200px",
    caretColor: "var(--color-foreground)",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-editor.cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    "background-color": "transparent",
    color: "var(--color-muted-foreground)",
    border: "none",
  },
  ".cm-activeLine": {
    "background-color": "transparent",
  },
  ".cm-activeLineGutter": {
    "background-color": "transparent",
  },
  ".cm-selectionBackground, ::selection": {
    "background-color": "rgba(99, 102, 241, 0.35)",
  },
  ".cm-cursor, .cm-dropCursor": {
    "border-left-color": "var(--color-foreground)",
  },
  ".cm-matchingBracket": {
    "background-color": "rgba(99, 102, 241, 0.16)",
    color: "inherit",
    outline: "1px solid rgba(99, 102, 241, 0.35)",
  },
  ".cm-placeholder": {
    color: "var(--color-muted-foreground)",
  },
});

const jsonHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--json-key-color)" },
  { tag: tags.string, color: "var(--json-string-color)" },
  { tag: tags.number, color: "var(--json-number-color)" },
  { tag: [tags.bool, tags.null], color: "var(--json-literal-color)" },
  {
    tag: [tags.separator, tags.squareBracket, tags.brace],
    color: "var(--json-punctuation-color)",
  },
]);

function getLanguageExtension(language: CodeEditorLanguage) {
  return language === "json" ? [json(), syntaxHighlighting(jsonHighlightStyle)] : [];
}

export function CodeEditor(props: CodeEditorProps) {
  const merged = mergeProps({ language: "plain" as CodeEditorLanguage, placeholder: "", ariaLabel: "Code editor" }, props);

  let containerRef: HTMLDivElement | undefined;
  let editorView: EditorView | undefined;
  let isApplyingExternalValue = false;

  const languageCompartment = new Compartment();
  const placeholderCompartment = new Compartment();

  onMount(() => {
    if (!containerRef) return;

    editorView = new EditorView({
      state: EditorState.create({
        doc: merged.value,
        extensions: [
          basicSetup,
          editorTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || isApplyingExternalValue) return;
            merged.onValueChange(update.state.doc.toString());
          }),
          EditorView.contentAttributes.of({
            "aria-label": merged.ariaLabel,
            spellcheck: "false",
          }),
          languageCompartment.of(getLanguageExtension(merged.language)),
          placeholderCompartment.of(placeholder(merged.placeholder)),
        ],
      }),
      parent: containerRef,
    });
  });

  createEffect(() => {
    if (!editorView) return;

    const nextValue = merged.value;
    const currentValue = editorView.state.doc.toString();

    if (currentValue === nextValue) return;

    isApplyingExternalValue = true;
    editorView.dispatch({
      changes: { from: 0, to: currentValue.length, insert: nextValue },
    });
    isApplyingExternalValue = false;
  });

  createEffect(() => {
    if (!editorView) return;

    editorView.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(merged.language)),
    });
  });

  createEffect(() => {
    if (!editorView) return;

    editorView.dispatch({
      effects: placeholderCompartment.reconfigure(placeholder(merged.placeholder)),
    });
  });

  onCleanup(() => editorView?.destroy());

  return (
    <div
      ref={containerRef}
      class={cn(
        "min-h-[200px] w-full overflow-hidden rounded-md border bg-transparent focus-within:ring-1 focus-within:ring-ring",
        merged.class
      )}
    />
  );
}
