import { createSignal, Show, For, createMemo } from "solid-js";
import { getActiveTab } from "~/store/app-store";
import { Badge } from "~/components/ui/badge";
import { cn, formatBytes, formatDuration } from "~/lib/utils";
import { highlightJson } from "~/lib/json-highlight";

type ResponseTab = "body" | "headers";
type BodyView = "pretty" | "raw";

export function ResponseViewer() {
  const [activeTab, setActiveTab] = createSignal<ResponseTab>("body");
  const [bodyView, setBodyView] = createSignal<BodyView>("pretty");

  const tab = () => getActiveTab();
  const response = () => tab()?.response;

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

        <div class="flex-1 overflow-auto">
          <Show when={activeTab() === "body"}>
            <Show
              when={bodyView() === "pretty"}
              fallback={
                <pre class="volt-tab-panel-in p-3 font-mono text-xs leading-relaxed text-foreground/90 select-text whitespace-pre-wrap break-all">
                  {response()!.body}
                </pre>
              }
            >
              <pre class="volt-json-response volt-tab-panel-in p-3 font-mono text-xs leading-relaxed select-text whitespace-pre-wrap break-all">
                <code class="language-json hljs" innerHTML={prettyJsonHtml()} />
              </pre>
            </Show>
          </Show>

          <Show when={activeTab() === "headers"}>
            <div class="volt-tab-panel-in p-2">
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
