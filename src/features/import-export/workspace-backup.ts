import { loadCollections } from "~/features/collections/collection-store";
import { loadSavedRequests } from "~/features/collections/saved-requests-store";
import { loadEnvironments } from "~/features/environments/env-store";
import { readExternalJsonFile, writeExternalJsonFile, writeJsonFile } from "~/lib/tauri";
import type {
  Collection,
  Environment,
  KeyValue,
  RequestBody,
  SavedRequest,
  WorkspaceBackupPayload,
} from "~/lib/types";
import { state } from "~/store/app-store";
import { generateId } from "~/lib/utils";

const COLLECTIONS_DIR = "collections";
const SAVED_REQUESTS_PATH = "saved-requests.json";
const ENVIRONMENTS_PATH = "environments/environments.json";

function cloneKeyValues(items: KeyValue[]): KeyValue[] {
  return items.map((item) => ({
    id: generateId(),
    key: item.key,
    value: item.value,
    enabled: item.enabled,
  }));
}

function cloneBody(body: RequestBody): RequestBody {
  return {
    type: body.type,
    content: body.content,
    formData: cloneKeyValues(body.formData),
  };
}

function cloneSavedRequest(request: SavedRequest): SavedRequest {
  return {
    id: generateId(),
    name: request.name,
    method: request.method,
    url: request.url,
    headers: cloneKeyValues(request.headers),
    queryParams: cloneKeyValues(request.queryParams),
    body: cloneBody(request.body),
    auth: JSON.parse(JSON.stringify(request.auth)),
  };
}

function cloneCollection(collection: Collection): Collection {
  return {
    id: generateId(),
    name: collection.name,
    requests: collection.requests.map(cloneSavedRequest),
    folders: collection.folders.map((folder) => ({
      id: generateId(),
      name: folder.name,
      requests: folder.requests.map(cloneSavedRequest),
    })),
  };
}

function cloneEnvironment(environment: Environment): Environment {
  return {
    id: generateId(),
    name: environment.name,
    variables: environment.variables.map((variable) => ({
      key: variable.key,
      value: variable.value,
      enabled: variable.enabled,
    })),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBackupPayload(value: unknown): WorkspaceBackupPayload {
  if (!isObject(value)) throw new Error("Invalid backup file.");
  if (value.version !== 1) throw new Error("Unsupported backup version.");
  if (!Array.isArray(value.collections) || !Array.isArray(value.savedRequests) || !Array.isArray(value.environments)) {
    throw new Error("Backup file is missing required sections.");
  }

  return value as unknown as WorkspaceBackupPayload;
}

export function buildWorkspaceBackupPayload(): WorkspaceBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    collections: JSON.parse(JSON.stringify(state.collections)) as Collection[],
    savedRequests: JSON.parse(JSON.stringify(state.savedRequests)) as SavedRequest[],
    environments: JSON.parse(JSON.stringify(state.environments)) as Environment[],
  };
}

export async function exportWorkspaceBackupToFile(filePath: string): Promise<void> {
  await writeExternalJsonFile(filePath, buildWorkspaceBackupPayload());
}

export async function importWorkspaceBackupFromFile(filePath: string): Promise<void> {
  const raw = await readExternalJsonFile<unknown>(filePath);
  const payload = parseBackupPayload(raw);

  const importedCollections = payload.collections.map(cloneCollection);
  const importedSavedRequests = payload.savedRequests.map(cloneSavedRequest);
  const importedEnvironments = payload.environments.map(cloneEnvironment);

  for (const collection of importedCollections) {
    await writeJsonFile(`${COLLECTIONS_DIR}/${collection.id}.json`, collection);
  }

  const nextSavedRequests = [
    ...(JSON.parse(JSON.stringify(state.savedRequests)) as SavedRequest[]),
    ...importedSavedRequests,
  ];
  await writeJsonFile(SAVED_REQUESTS_PATH, nextSavedRequests);

  const nextEnvironments = [
    ...(JSON.parse(JSON.stringify(state.environments)) as Environment[]),
    ...importedEnvironments,
  ];
  await writeJsonFile(ENVIRONMENTS_PATH, nextEnvironments);

  await Promise.all([loadCollections(), loadSavedRequests(), loadEnvironments()]);
}
