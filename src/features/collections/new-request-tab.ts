import { generateId } from "~/lib/utils";
import { createDefaultRequest, type SavedRequest } from "~/lib/types";
import { openRequestInTab } from "~/store/app-store";
import { addSavedRequest } from "./saved-requests-store";

export async function createNewRequestTab(): Promise<void> {
  const requestId = generateId();
  const req = createDefaultRequest();
  const saved: SavedRequest = {
    id: requestId,
    name: "New Request",
    method: req.method,
    url: req.url,
    headers: [...req.headers],
    queryParams: [...req.queryParams],
    body: { ...req.body },
    auth: { ...req.auth },
  };
  await addSavedRequest(saved);
  openRequestInTab(
    {
      method: saved.method,
      url: saved.url,
      headers: [...saved.headers],
      queryParams: [...saved.queryParams],
      body: { ...saved.body },
      auth: { ...saved.auth },
    },
    saved.name,
    { type: "standalone", requestId: saved.id }
  );
}
