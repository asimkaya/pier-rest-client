import { invoke } from "@tauri-apps/api/core";
import type { RequestConfig, ResponseData } from "./types";

interface TauriHttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: { type: string; content: string } | null;
  timeoutMs: number | null;
}

function buildTauriRequest(config: RequestConfig): TauriHttpRequest {
  const headers: Record<string, string> = {};
  for (const h of config.headers) {
    if (h.enabled && h.key) headers[h.key] = h.value;
  }

  if (config.auth.type === "bearer" && config.auth.bearer.token) {
    headers["Authorization"] = `Bearer ${config.auth.bearer.token}`;
  } else if (config.auth.type === "basic") {
    const encoded = btoa(`${config.auth.basic.username}:${config.auth.basic.password}`);
    headers["Authorization"] = `Basic ${encoded}`;
  } else if (config.auth.type === "apiKey" && config.auth.apiKey.location === "header") {
    headers[config.auth.apiKey.key] = config.auth.apiKey.value;
  }

  const queryParams: Record<string, string> = {};
  for (const p of config.queryParams) {
    if (p.enabled && p.key) queryParams[p.key] = p.value;
  }

  if (config.auth.type === "apiKey" && config.auth.apiKey.location === "queryParam") {
    queryParams[config.auth.apiKey.key] = config.auth.apiKey.value;
  }

  let body: { type: string; content: string } | null = null;
  if (config.body.type === "json" && config.body.content) {
    body = { type: "json", content: config.body.content };
  } else if (config.body.type === "raw" && config.body.content) {
    body = { type: "raw", content: config.body.content };
  } else if (config.body.type === "formData") {
    const formObj: Record<string, string> = {};
    for (const f of config.body.formData) {
      if (f.enabled && f.key) formObj[f.key] = f.value;
    }
    body = { type: "formData", content: JSON.stringify(formObj) };
  }

  return {
    method: config.method,
    url: config.url,
    headers,
    queryParams,
    body,
    timeoutMs: 30000,
  };
}

export async function sendRequest(config: RequestConfig): Promise<ResponseData> {
  const request = buildTauriRequest(config);
  return invoke<ResponseData>("send_request", { request });
}

export async function readJsonFile<T>(relativePath: string): Promise<T | null> {
  const result = await invoke<string>("read_json_file", { relativePath });
  if (result === "null") return null;
  return JSON.parse(result) as T;
}

export async function writeJsonFile(relativePath: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await invoke("write_json_file", { relativePath, content });
}

export async function deleteJsonFile(relativePath: string): Promise<void> {
  await invoke("delete_json_file", { relativePath });
}

export async function listJsonFiles(relativeDir: string): Promise<string[]> {
  return invoke<string[]>("list_json_files", { relativeDir });
}
