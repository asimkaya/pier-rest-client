import { createSignal, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { CodeEditor } from "~/components/ui/code-editor";
import { createStandaloneRequestTab } from "~/features/collections/new-request-tab";
import { getActiveTab, setTabResponse, state, updateTabRequest } from "~/store/app-store";
import { closeCurlImportModal, curlImportModalOpen } from "./import-export-store";
import { parseCurlCommand } from "./curl-import";

export function CurlImportModal() {
  const [commandText, setCommandText] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal("");

  function resetAndClose() {
    setCommandText("");
    setErrorMessage("");
    closeCurlImportModal();
  }

  function applyToCurrentTab() {
    const activeTab = getActiveTab();
    if (!activeTab) return;

    try {
      const parsed = parseCurlCommand(commandText());
      updateTabRequest(activeTab.id, parsed.request);
      setTabResponse(activeTab.id, null);
      resetAndClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to parse cURL command.");
    }
  }

  async function openInNewTab() {
    try {
      const parsed = parseCurlCommand(commandText());
      await createStandaloneRequestTab(parsed.request, parsed.name);
      resetAndClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to parse cURL command.");
    }
  }

  return (
    <Show when={curlImportModalOpen()}>
      <div
        class="fixed inset-0 z-[10045] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="curl-import-title"
        onClick={resetAndClose}
      >
        <div
          class="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg border bg-popover shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="border-b px-4 py-3">
            <h2 id="curl-import-title" class="text-sm font-semibold text-foreground">
              Import cURL
            </h2>
            <p class="mt-1 text-xs text-muted-foreground">
              Paste a cURL command to fill the active request or open it in a new tab.
            </p>
          </div>

          <div class="flex-1 space-y-3 overflow-y-auto p-4">
            <CodeEditor
              value={commandText()}
              onValueChange={(value) => {
                setCommandText(value);
                if (errorMessage()) setErrorMessage("");
              }}
              language="plain"
              placeholder={"curl https://api.example.com/users -H 'Authorization: Bearer token'"}
              ariaLabel="cURL import input"
            />

            <Show when={errorMessage()}>
              <p class="text-xs text-destructive">{errorMessage()}</p>
            </Show>
          </div>

          <div class="flex items-center justify-end gap-2 border-t px-4 py-3">
            <Button variant="ghost" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => void applyToCurrentTab()} disabled={state.tabs.length === 0}>
              Apply To Current Tab
            </Button>
            <Button onClick={() => void openInNewTab()}>Open In New Tab</Button>
          </div>
        </div>
      </div>
    </Show>
  );
}
