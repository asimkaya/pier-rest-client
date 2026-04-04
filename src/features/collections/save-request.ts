import { getActiveTab, setTabSavedLocation, setTabDirty } from "~/store/app-store";
import {
  updateRequestInCollection,
  loadCollections,
} from "./collection-store";
import { readJsonFile, writeJsonFile } from "~/lib/tauri";
import { generateId } from "~/lib/utils";
import type { SavedRequest, Collection } from "~/lib/types";

const UNSORTED_PATH = "collections/_unsorted.json";

async function getOrCreateUnsorted(): Promise<Collection> {
  try {
    const data = await readJsonFile<Collection>(UNSORTED_PATH);
    if (data) return data;
  } catch {
    // file doesn't exist
  }
  const col: Collection = { id: "_unsorted", name: "Saved Requests", folders: [], requests: [] };
  await writeJsonFile(UNSORTED_PATH, col);
  return col;
}

export async function saveActiveRequest(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;

  if (tab.savedLocation) {
    await updateRequestInCollection(tab.savedLocation.collectionId, tab.savedLocation.requestId, {
      name: tab.name,
      method: tab.request.method,
      url: tab.request.url,
      headers: [...tab.request.headers],
      queryParams: [...tab.request.queryParams],
      body: { ...tab.request.body },
      auth: { ...tab.request.auth },
    });
    setTabDirty(tab.id, false);
    return;
  }

  const unsorted = await getOrCreateUnsorted();
  const requestId = generateId();
  const saved: SavedRequest = {
    id: requestId,
    name: tab.name || tab.request.url || "Untitled",
    method: tab.request.method,
    url: tab.request.url,
    headers: [...tab.request.headers],
    queryParams: [...tab.request.queryParams],
    body: { ...tab.request.body },
    auth: { ...tab.request.auth },
  };

  unsorted.requests.push(saved);
  await writeJsonFile(UNSORTED_PATH, unsorted);
  await loadCollections();

  setTabSavedLocation(tab.id, {
    type: "collection",
    collectionId: "_unsorted",
    requestId,
  });
}
