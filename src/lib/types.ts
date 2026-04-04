export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type BodyType = "json" | "raw" | "formData" | "none";

export interface RequestBody {
  type: BodyType;
  content: string;
  formData: KeyValue[];
}

export type AuthType = "none" | "bearer" | "basic" | "apiKey";
export type ApiKeyLocation = "header" | "queryParam";

export interface AuthConfig {
  type: AuthType;
  bearer: { token: string };
  basic: { username: string; password: string };
  apiKey: { key: string; value: string; location: ApiKeyLocation };
}

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  body: RequestBody;
  auth: AuthConfig;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  sizeBytes: number;
}

export interface SavedLocation {
  type: "collection" | "standalone";
  collectionId?: string;
  folderId?: string;
  requestId: string;
}

export interface Tab {
  id: string;
  name: string;
  request: RequestConfig;
  response: ResponseData | null;
  isDirty: boolean;
  isLoading: boolean;
  savedLocation?: SavedLocation;
}

export interface Collection {
  id: string;
  name: string;
  folders: CollectionFolder[];
  requests: SavedRequest[];
}

export interface CollectionFolder {
  id: string;
  name: string;
  requests: SavedRequest[];
}

export interface SavedRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  body: RequestBody;
  auth: AuthConfig;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestLog {
  id: string;
  timestamp: string;
  method: HttpMethod;
  url: string;
  status: number;
  durationMs: number;
  request: RequestConfig;
}

export type SidebarView = "collections" | "history" | "environments";
export type ThemeMode = "light" | "dark" | "system";

export function createDefaultRequest(): RequestConfig {
  return {
    method: "GET",
    url: "",
    headers: [],
    queryParams: [],
    body: { type: "none", content: "", formData: [] },
    auth: {
      type: "none",
      bearer: { token: "" },
      basic: { username: "", password: "" },
      apiKey: { key: "", value: "", location: "header" },
    },
  };
}

export function createDefaultTab(id: string): Tab {
  return {
    id,
    name: "New Request",
    request: createDefaultRequest(),
    response: null,
    isDirty: false,
    isLoading: false,
  };
}
