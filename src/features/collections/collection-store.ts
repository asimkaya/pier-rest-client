import { setCollections, state } from "~/store/app-store";
import { readJsonFile, writeJsonFile, deleteJsonFile, listJsonFiles } from "~/lib/tauri";
import type { Collection, SavedRequest, CollectionFolder } from "~/lib/types";
import { generateId } from "~/lib/utils";
import { createDefaultRequest } from "~/lib/types";

const COLLECTIONS_DIR = "collections";

function collectionPath(id: string): string {
  return `${COLLECTIONS_DIR}/${id}.json`;
}

export async function loadCollections(): Promise<void> {
  try {
    const files = await listJsonFiles(COLLECTIONS_DIR);
    const collections: Collection[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const data = await readJsonFile<Collection>(`${COLLECTIONS_DIR}/${file}`);
      if (data) collections.push(data);
    }

    collections.sort((a, b) => a.name.localeCompare(b.name));
    setCollections(collections);
  } catch {
    setCollections([]);
  }
}

export async function createCollection(name: string): Promise<Collection> {
  const collection: Collection = {
    id: generateId(),
    name,
    folders: [],
    requests: [],
  };
  await writeJsonFile(collectionPath(collection.id), collection);
  await loadCollections();
  return collection;
}

export async function renameCollection(id: string, name: string): Promise<void> {
  const collection = state.collections.find((c) => c.id === id);
  if (!collection) return;
  const updated = { ...collection, name };
  await writeJsonFile(collectionPath(id), updated);
  await loadCollections();
}

export async function deleteCollection(id: string): Promise<void> {
  await deleteJsonFile(collectionPath(id));
  await loadCollections();
}

export async function addRequestToCollection(
  collectionId: string,
  folderId: string | null,
  request: SavedRequest
): Promise<void> {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) return;

  const updated = structuredClone(collection) as Collection;

  if (folderId) {
    const folder = updated.folders.find((f) => f.id === folderId);
    if (folder) folder.requests.push(request);
  } else {
    updated.requests.push(request);
  }

  await writeJsonFile(collectionPath(collectionId), updated);
  await loadCollections();
}

export async function removeRequestFromCollection(
  collectionId: string,
  requestId: string
): Promise<void> {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) return;

  const updated = structuredClone(collection) as Collection;
  updated.requests = updated.requests.filter((r) => r.id !== requestId);
  for (const folder of updated.folders) {
    folder.requests = folder.requests.filter((r) => r.id !== requestId);
  }

  await writeJsonFile(collectionPath(collectionId), updated);
  await loadCollections();
}

export async function addFolderToCollection(
  collectionId: string,
  name: string
): Promise<void> {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) return;

  const updated = structuredClone(collection) as Collection;
  updated.folders.push({ id: generateId(), name, requests: [] });

  await writeJsonFile(collectionPath(collectionId), updated);
  await loadCollections();
}

export async function removeFolderFromCollection(
  collectionId: string,
  folderId: string
): Promise<void> {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) return;

  const updated = structuredClone(collection) as Collection;
  updated.folders = updated.folders.filter((f) => f.id !== folderId);

  await writeJsonFile(collectionPath(collectionId), updated);
  await loadCollections();
}

export function savedRequestFromTab(name: string, tabId: string): SavedRequest | null {
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!tab) return null;

  return {
    id: generateId(),
    name,
    method: tab.request.method,
    url: tab.request.url,
    headers: [...tab.request.headers],
    queryParams: [...tab.request.queryParams],
    body: { ...tab.request.body },
    auth: { ...tab.request.auth },
  };
}
