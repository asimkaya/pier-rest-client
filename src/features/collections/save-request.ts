import { getActiveTab, setTabSavedLocation, setTabDirty } from "~/store/app-store";
import { updateRequestInCollection } from "./collection-store";
import { addSavedRequest, updateSavedRequest } from "./saved-requests-store";
import { generateId } from "~/lib/utils";
import type { SavedRequest } from "~/lib/types";

export async function saveActiveRequest(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;

  if (tab.savedLocation?.type === "collection" && tab.savedLocation.collectionId) {
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

  if (tab.savedLocation?.type === "standalone") {
    await updateSavedRequest(tab.savedLocation.requestId, {
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

  await addSavedRequest(saved);

  setTabSavedLocation(tab.id, {
    type: "standalone",
    requestId,
  });
}
