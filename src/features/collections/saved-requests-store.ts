import { setSavedRequests, state } from "~/store/app-store";
import { readJsonFile, writeJsonFile } from "~/lib/tauri";
import type { SavedRequest } from "~/lib/types";

const SAVED_PATH = "saved-requests.json";

export async function loadSavedRequests(): Promise<void> {
  try {
    const data = await readJsonFile<SavedRequest[]>(SAVED_PATH);
    setSavedRequests(data ?? []);
  } catch {
    setSavedRequests([]);
  }
}

async function persist(): Promise<void> {
  await writeJsonFile(SAVED_PATH, JSON.parse(JSON.stringify(state.savedRequests)));
}

export async function addSavedRequest(request: SavedRequest): Promise<void> {
  setSavedRequests([...state.savedRequests, request]);
  await persist();
}

export async function updateSavedRequest(id: string, updates: Partial<SavedRequest>): Promise<void> {
  setSavedRequests(
    state.savedRequests.map((r) => {
      if (r.id !== id) return JSON.parse(JSON.stringify(r));
      return { ...JSON.parse(JSON.stringify(r)), ...updates };
    })
  );
  await persist();
}

export async function removeSavedRequest(id: string): Promise<void> {
  setSavedRequests(state.savedRequests.filter((r) => r.id !== id));
  await persist();
}

export async function renameSavedRequest(id: string, name: string): Promise<void> {
  await updateSavedRequest(id, { name });
}
