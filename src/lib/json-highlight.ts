import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";

hljs.registerLanguage("json", json);

export function highlightJson(formattedSource: string): string {
  if (!formattedSource) return "";
  try {
    return hljs.highlight(formattedSource, { language: "json", ignoreIllegals: true }).value;
  } catch {
    return hljs.highlightAuto(formattedSource).value;
  }
}
