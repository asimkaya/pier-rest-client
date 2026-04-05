import { createSignal, Show, For, createMemo, onCleanup } from "solid-js";
import { getActiveTab } from "~/store/app-store";
import { Badge } from "~/components/ui/badge";
import { cn, formatBytes, formatDuration } from "~/lib/utils";
import { highlightJson } from "~/lib/json-highlight";

type ResponseTab = "body" | "headers";
type BodyView = "pretty" | "raw";

export function ResponseViewer() {
  const [activeTab, setActiveTab] = createSignal<ResponseTab>("body");
  const [bodyView, setBodyView] = createSignal<BodyView>("pretty");
  const [copyBodyDone, setCopyBodyDone] = createSignal(false);

  let copyBodyResetTimer: number | undefined;

  const tab = () => getActiveTab();
  const response = () => tab()?.response;

  onCleanup(() => window.clearTimeout(copyBodyResetTimer));

  const formattedJsonBody = createMemo(() => {
    const body = response()?.body;
    if (!body) return "";
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  });

  const prettyJsonHtml = createMemo(() => highlightJson(formattedJsonBody()));

  function bodyClipboardText(): string {
    if (bodyView() === "pretty") return formattedJsonBody();
    return response()!.body;
  }

  async function copyResponseBody() {
    try {
      await navigator.clipboard.writeText(bodyClipboardText());
      setCopyBodyDone(true);
      window.clearTimeout(copyBodyResetTimer);
      copyBodyResetTimer = window.setTimeout(() => setCopyBodyDone(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function getStatusVariant(status: number) {
    if (status >= 200 && status < 300) return "success" as const;
    if (status >= 300 && status < 400) return "warning" as const;
    if (status >= 400) return "destructive" as const;
    return "secondary" as const;
  }

  return (
    <div class="flex h-full flex-col">
      <Show when={tab()?.isLoading}>
        <div class="flex flex-1 items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <svg class="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <p class="text-sm text-muted-foreground">Sending request...</p>
          </div>
        </div>
      </Show>

      <Show when={!tab()?.isLoading && !response()}>
        <div class="flex flex-1 items-center justify-center">
          <div class="flex flex-col items-center gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="text-muted-foreground/30">
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                stroke="currentColor"
                stroke-width="1"
                stroke-linejoin="round"
              />
            </svg>
            <div>
              <p class="text-sm font-medium text-muted-foreground">No response yet</p>
              <p class="mt-1 text-xs text-muted-foreground/60">
                Enter a URL and click Send or press Ctrl+Enter
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={!tab()?.isLoading && response()}>
        {/* Response Meta */}
        <div class="flex items-center gap-3 border-b px-3 py-2">
          <Badge variant={getStatusVariant(response()!.status)}>
            {response()!.status} {response()!.statusText}
          </Badge>
          <span class="text-xs text-muted-foreground">
            {formatDuration(response()!.durationMs)}
          </span>
          <span class="text-xs text-muted-foreground">
            {formatBytes(response()!.sizeBytes)}
          </span>
        </div>

        {/* Response Tabs */}
        <div class="flex items-center border-b px-2">
          <button
            type="button"
            class={cn(
              "relative px-3 py-2 text-xs font-medium transition-colors duration-200 ease-out",
              activeTab() === "body" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("body")}
          >
            Body
            {activeTab() === "body" && <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            type="button"
            class={cn(
              "relative px-3 py-2 text-xs font-medium transition-colors duration-200 ease-out",
              activeTab() === "headers" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("headers")}
          >
            Headers
            <span class="ml-1 text-[10px] text-muted-foreground">
              ({Object.keys(response()!.headers).length})
            </span>
            {activeTab() === "headers" && <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <Show when={activeTab() === "body"}>
            <div class="ml-auto flex gap-0.5">
              <button
                type="button"
                class={cn(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors duration-200 ease-out",
                  bodyView() === "pretty" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setBodyView("pretty")}
              >
                Pretty
              </button>
              <button
                type="button"
                class={cn(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors duration-200 ease-out",
                  bodyView() === "raw" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setBodyView("raw")}
              >
                Raw
              </button>
            </div>
          </Show>
        </div>

        <div class="relative min-h-0 flex-1 overflow-auto">
          <Show when={activeTab() === "body"}>
            <button
              type="button"
              class={cn(
                "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              )}
              onClick={() => void copyResponseBody()}
              aria-label={copyBodyDone() ? "Copied" : "Copy response body"}
            >
              <span
                class={cn(
                  "absolute flex items-center justify-center transition-all duration-200 ease-out",
                  copyBodyDone() ? "scale-50 opacity-0" : "scale-100 opacity-100"
                )}
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </span>
              <span
                class={cn(
                  "absolute flex items-center justify-center text-success transition-all duration-200 ease-out",
                  copyBodyDone() ? "scale-100 opacity-100" : "scale-50 opacity-0"
                )}
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </button>
            <Show
              when={bodyView() === "pretty"}
              fallback={
                <pre class="pier-tab-panel-in p-3 pr-12 pt-11 font-mono text-xs leading-relaxed text-foreground/90 select-text whitespace-pre-wrap break-all">
                  {response()!.body}
                </pre>
              }
            >
              <pre class="pier-json-response pier-tab-panel-in p-3 pr-12 pt-11 font-mono text-xs leading-relaxed select-text whitespace-pre-wrap break-all">
                <code class="language-json hljs" innerHTML={prettyJsonHtml()} />
              </pre>
            </Show>
          </Show>

          <Show when={activeTab() === "headers"}>
            <div class="pier-tab-panel-in p-2">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b text-left text-muted-foreground">
                    <th class="px-2 py-1.5 font-medium">Name</th>
                    <th class="px-2 py-1.5 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={Object.entries(response()!.headers)}>
                    {([key, value]) => (
                      <tr class="border-b border-border/50 hover:bg-muted/30">
                        <td class="px-2 py-1.5 font-mono font-semibold text-primary/80 select-text">{key}</td>
                        <td class="px-2 py-1.5 font-mono text-foreground/80 select-text break-all">{value}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
