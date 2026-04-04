import { setHistory, clearHistory as clearHistoryState, state } from "~/store/app-store";
import { readJsonFile, writeJsonFile } from "~/lib/tauri";
import type { RequestLog } from "~/lib/types";

const HISTORY_PATH = "history/history.json";

export async function loadHistory(): Promise<void> {
  try {
    const data = await readJsonFile<RequestLog[]>(HISTORY_PATH);
    setHistory(data ?? []);
  } catch {
    setHistory([]);
  }
}

export async function saveHistory(): Promise<void> {
  await writeJsonFile(HISTORY_PATH, state.history);
}

export async function clearHistory(): Promise<void> {
  clearHistoryState();
  await saveHistory();
}
