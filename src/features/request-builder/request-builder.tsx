import { createSignal, Show } from "solid-js";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { CodeEditor } from "~/components/ui/code-editor";
import { KeyValueEditor } from "./key-value-editor";
import { AuthEditor } from "./auth-editor";
import { state, updateTabRequest, setTabLoading, setTabResponse } from "~/store/app-store";
import { getActiveTab } from "~/store/app-store";
import { addHistoryEntry } from "~/store/app-store";
import { sendRequest } from "~/lib/tauri";
import { saveHistory } from "~/features/history/history-store";
import { looksLikeCurlCommand, parseCurlCommand } from "~/features/import-export/curl-import";
import { cn, generateId, getMethodColor } from "~/lib/utils";
import type { HttpMethod, BodyType, KeyValue, RequestConfig, AuthConfig } from "~/lib/types";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "raw", label: "Raw" },
  { value: "formData", label: "Form" },
];

type RequestTab = "params" | "headers" | "body" | "auth";

export function RequestBuilder() {
  const [activeSection, setActiveSection] = createSignal<RequestTab>("params");
  const [methodOpen, setMethodOpen] = createSignal(false);

  const tab = () => getActiveTab();

  function updateRequest(partial: Partial<RequestConfig>) {
    const t = tab();
    if (t) updateTabRequest(t.id, partial);
  }

  async function handleSend() {
    const t = tab();
    if (!t || !t.request.url) return;

    setTabLoading(t.id, true);
    try {
      const response = await sendRequest(t.request);
      setTabResponse(t.id, response);

      addHistoryEntry({
        id: generateId(),
        timestamp: new Date().toISOString(),
        method: t.request.method,
        url: t.request.url,
        status: response.status,
        durationMs: response.durationMs,
        request: { ...t.request },
      });
      saveHistory();
    } catch (err) {
      setTabResponse(t.id, {
        status: 0,
        statusText: "Error",
        headers: {},
        body: String(err),
        durationMs: 0,
        sizeBytes: 0,
      });
    }
  }

  const sections: { id: RequestTab; label: string }[] = [
    { id: "params", label: "Params" },
    { id: "headers", label: "Headers" },
    { id: "body", label: "Body" },
    { id: "auth", label: "Auth" },
  ];

  return (
    <div class="flex h-full flex-col">
      <div class="flex items-center gap-2 border-b p-2">
        <div class="relative">
          <button
            class={cn(
              "flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-bold font-mono transition-colors",
              getMethodColor(tab()?.request.method ?? "GET")
            )}
            onClick={() => setMethodOpen(!methodOpen())}
          >
            {tab()?.request.method ?? "GET"}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M1 3l3 3 3-3" />
            </svg>
          </button>
          <Show when={methodOpen()}>
            <div class="absolute left-0 top-full z-50 mt-1 rounded-md border bg-popover py-1 shadow-lg">
              {HTTP_METHODS.map((m) => (
                <button
                  class={cn(
                    "flex w-full px-3 py-1.5 text-xs font-mono font-bold hover:bg-accent transition-colors",
                    getMethodColor(m)
                  )}
                  onClick={() => {
                    updateRequest({ method: m });
                    setMethodOpen(false);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </Show>
        </div>

        <Input
          value={tab()?.request.url ?? ""}
          onInput={(e) => updateRequest({ url: e.currentTarget.value })}
          onPaste={(e) => {
            const pastedText = e.clipboardData?.getData("text") ?? "";
            if (!looksLikeCurlCommand(pastedText)) return;

            try {
              const parsed = parseCurlCommand(pastedText);
              e.preventDefault();
              const activeTab = tab();
              if (!activeTab) return;
              updateTabRequest(activeTab.id, parsed.request);
              setTabResponse(activeTab.id, null);
            } catch {
              /* fall back to normal paste when parsing fails */
            }
          }}
          placeholder="Enter URL or paste cURL"
          class="flex-1 font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSend();
            }
          }}
        />

        <Button
          onClick={handleSend}
          disabled={tab()?.isLoading || !tab()?.request.url}
          class="shrink-0 gap-2"
        >
          {tab()?.isLoading ? (
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
          Send
        </Button>
      </div>

      <div class="flex items-center border-b px-2">
        {sections.map((s) => (
          <button
            type="button"
            class={cn(
              "relative px-3 py-2 text-xs font-medium transition-colors duration-200 ease-out",
              activeSection() === s.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
            {s.id === "params" && (tab()?.request.queryParams.length ?? 0) > 0 && (
              <span class="ml-1 text-[10px] text-primary">({tab()?.request.queryParams.length})</span>
            )}
            {s.id === "headers" && (tab()?.request.headers.length ?? 0) > 0 && (
              <span class="ml-1 text-[10px] text-primary">({tab()?.request.headers.length})</span>
            )}
            {activeSection() === s.id && (
              <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div class="flex-1 overflow-y-auto p-2">
        <Show when={activeSection() === "params"}>
          <div class="pier-tab-panel-in">
            <KeyValueEditor
              items={tab()?.request.queryParams ?? []}
              onChange={(items: KeyValue[]) => updateRequest({ queryParams: items })}
              keyPlaceholder="Parameter"
              valuePlaceholder="Value"
            />
          </div>
        </Show>

        <Show when={activeSection() === "headers"}>
          <div class="pier-tab-panel-in">
            <KeyValueEditor
              items={tab()?.request.headers ?? []}
              onChange={(items: KeyValue[]) => updateRequest({ headers: items })}
              keyPlaceholder="Header"
              valuePlaceholder="Value"
            />
          </div>
        </Show>

        <Show when={activeSection() === "body"}>
          <div class="pier-tab-panel-in space-y-2">
            <div class="flex gap-1">
              {BODY_TYPES.map((bt) => (
                <button
                  type="button"
                  class={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    tab()?.request.body.type === bt.value
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() =>
                    updateRequest({ body: { ...tab()!.request.body, type: bt.value } })
                  }
                >
                  {bt.label}
                </button>
              ))}
            </div>

            <Show when={tab()?.request.body.type === "json" || tab()?.request.body.type === "raw"}>
              <CodeEditor
                value={tab()?.request.body.content ?? ""}
                onValueChange={(content) =>
                  updateRequest({
                    body: { ...tab()!.request.body, content },
                  })
                }
                language={tab()?.request.body.type === "json" ? "json" : "plain"}
                placeholder={
                  tab()?.request.body.type === "json"
                    ? '{\n  "key": "value"\n}'
                    : "Enter request body"
                }
                ariaLabel={tab()?.request.body.type === "json" ? "JSON request body editor" : "Raw request body editor"}
              />
            </Show>

            <Show when={tab()?.request.body.type === "formData"}>
              <KeyValueEditor
                items={tab()?.request.body.formData ?? []}
                onChange={(items: KeyValue[]) =>
                  updateRequest({ body: { ...tab()!.request.body, formData: items } })
                }
              />
            </Show>

            <Show when={tab()?.request.body.type === "none"}>
              <p class="py-4 text-center text-xs text-muted-foreground">
                This request does not have a body.
              </p>
            </Show>
          </div>
        </Show>

        <Show when={activeSection() === "auth"}>
          <div class="pier-tab-panel-in">
            <AuthEditor
              auth={tab()?.request.auth ?? {
                type: "none",
                bearer: { token: "" },
                basic: { username: "", password: "" },
                apiKey: { key: "", value: "", location: "header" },
              }}
              onChange={(auth: AuthConfig) => updateRequest({ auth })}
            />
          </div>
        </Show>
      </div>
    </div>
  );
}
