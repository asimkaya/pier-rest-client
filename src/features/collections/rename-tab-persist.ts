import { state, renameTab } from "~/store/app-store";
import { renameSavedRequest } from "./saved-requests-store";
import { renameRequestInCollection } from "./collection-store";

export async function renameTabAndPersist(tabId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  const tab = state.tabs.find((t) => t.id === tabId);
  const loc = tab?.savedLocation;
  renameTab(tabId, trimmed);
  if (!loc) return;
  if (loc.type === "standalone") await renameSavedRequest(loc.requestId, trimmed);
  else if (loc.collectionId) await renameRequestInCollection(loc.collectionId, loc.requestId, trimmed);
}
