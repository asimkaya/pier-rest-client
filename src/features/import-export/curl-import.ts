import { createDefaultRequest, type AuthConfig, type HttpMethod, type KeyValue, type RequestConfig } from "~/lib/types";
import { generateId } from "~/lib/utils";

interface ParsedCurlCommand {
  name: string;
  request: RequestConfig;
}

const HTTP_METHODS = new Set<HttpMethod>(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const DATA_FLAGS = new Set(["-d", "--data", "--data-raw", "--data-binary", "--data-ascii"]);
const HEADER_FLAGS = new Set(["-H", "--header"]);
const REQUEST_FLAGS = new Set(["-X", "--request"]);
const USER_FLAGS = new Set(["-u", "--user"]);
const URL_FLAGS = new Set(["--url"]);

function decodeFormComponent(value: string): string {
  return decodeURIComponent(value.replace(/\+/g, " "));
}

function splitUrlAndQueryParams(rawUrl: string): { url: string; queryParams: KeyValue[] } {
  try {
    const parsed = new URL(rawUrl);
    const queryParams = Array.from(parsed.searchParams.entries()).map(([key, value]) => ({
      id: generateId(),
      key,
      value,
      enabled: true,
    }));
    parsed.search = "";
    return { url: parsed.toString(), queryParams };
  } catch {
    const queryStart = rawUrl.indexOf("?");
    if (queryStart === -1) return { url: rawUrl, queryParams: [] };

    const url = rawUrl.slice(0, queryStart);
    const queryString = rawUrl.slice(queryStart + 1);
    const queryParams = queryString
      .split("&")
      .filter(Boolean)
      .map((part) => {
        const [rawKey, ...rest] = part.split("=");
        return {
          id: generateId(),
          key: decodeFormComponent(rawKey ?? ""),
          value: decodeFormComponent(rest.join("=")),
          enabled: true,
        };
      });

    return { url, queryParams };
  }
}

function tokenizeCurlCommand(input: string): string[] {
  const normalized = input.replace(/\\\r?\n/g, " ").trim();
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];

    if (quote) {
      if (char === quote) {
        quote = null;
        continue;
      }

      if (char === "\\" && quote === '"' && i + 1 < normalized.length) {
        current += normalized[i + 1];
        i += 1;
        continue;
      }

      current += char;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (char === "\\" && i + 1 < normalized.length) {
      current += normalized[i + 1];
      i += 1;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

function parseHeader(value: string): KeyValue | null {
  const separatorIndex = value.indexOf(":");
  if (separatorIndex === -1) return null;

  return {
    id: generateId(),
    key: value.slice(0, separatorIndex).trim(),
    value: value.slice(separatorIndex + 1).trim(),
    enabled: true,
  };
}

function inferBodyAndAuth(
  headers: KeyValue[],
  bodyChunks: string[],
  basicAuthValue: string | null
): Pick<RequestConfig, "body" | "auth"> {
  const contentType = headers.find((header) => header.key.toLowerCase() === "content-type")?.value.toLowerCase() ?? "";
  const bodyContent = bodyChunks.join("&");

  let body = createDefaultRequest().body;
  if (bodyContent) {
    if (contentType.includes("application/json")) {
      body = { type: "json", content: bodyContent, formData: [] };
    } else if (
      contentType.includes("application/x-www-form-urlencoded") &&
      bodyContent.split("&").every((part) => part.includes("="))
    ) {
      body = {
        type: "formData",
        content: "",
        formData: bodyContent.split("&").map((part) => {
          const [rawKey, ...rest] = part.split("=");
          return {
            id: generateId(),
            key: decodeFormComponent(rawKey ?? ""),
            value: decodeFormComponent(rest.join("=")),
            enabled: true,
          };
        }),
      };
    } else if ((bodyContent.trim().startsWith("{") || bodyContent.trim().startsWith("[")) && contentType === "") {
      body = { type: "json", content: bodyContent, formData: [] };
    } else {
      body = { type: "raw", content: bodyContent, formData: [] };
    }
  }

  const auth: AuthConfig = createDefaultRequest().auth;
  if (basicAuthValue) {
    const [username, ...rest] = basicAuthValue.split(":");
    auth.type = "basic";
    auth.basic = { username: username ?? "", password: rest.join(":") };
  }

  return { body, auth };
}

function deriveRequestName(method: HttpMethod, url: string): string {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}` || parsed.host;
    return `${method} ${path || parsed.host}`;
  } catch {
    return `${method} ${url}`;
  }
}

export function looksLikeCurlCommand(value: string): boolean {
  return value.trim().toLowerCase().startsWith("curl ");
}

export function parseCurlCommand(input: string): ParsedCurlCommand {
  const tokens = tokenizeCurlCommand(input);
  if (!tokens.length) throw new Error("Empty cURL command.");

  const workingTokens = tokens[0].toLowerCase() === "curl" ? tokens.slice(1) : tokens;
  if (!workingTokens.length) throw new Error("cURL command is missing arguments.");

  let method: HttpMethod | null = null;
  let url = "";
  let basicAuthValue: string | null = null;
  const headers: KeyValue[] = [];
  const bodyChunks: string[] = [];

  for (let i = 0; i < workingTokens.length; i += 1) {
    const token = workingTokens[i];

    if (REQUEST_FLAGS.has(token)) {
      const nextToken = workingTokens[i + 1]?.toUpperCase();
      if (!nextToken || !HTTP_METHODS.has(nextToken as HttpMethod)) {
        throw new Error("Unsupported or missing HTTP method in cURL command.");
      }
      method = nextToken as HttpMethod;
      i += 1;
      continue;
    }

    if (HEADER_FLAGS.has(token)) {
      const nextToken = workingTokens[i + 1];
      if (!nextToken) throw new Error("Header flag is missing a value.");
      const header = parseHeader(nextToken);
      if (header) headers.push(header);
      i += 1;
      continue;
    }

    if (DATA_FLAGS.has(token)) {
      const nextToken = workingTokens[i + 1];
      if (!nextToken) throw new Error("Data flag is missing a value.");
      if (nextToken.startsWith("@")) {
        throw new Error("File-based cURL data imports are not supported yet.");
      }
      bodyChunks.push(nextToken);
      i += 1;
      continue;
    }

    if (USER_FLAGS.has(token)) {
      const nextToken = workingTokens[i + 1];
      if (!nextToken) throw new Error("User flag is missing credentials.");
      basicAuthValue = nextToken;
      i += 1;
      continue;
    }

    if (URL_FLAGS.has(token)) {
      const nextToken = workingTokens[i + 1];
      if (!nextToken) throw new Error("URL flag is missing a value.");
      url = nextToken;
      i += 1;
      continue;
    }

    if (token.startsWith("-")) {
      continue;
    }

    if (!url) {
      url = token;
    }
  }

  if (!url) throw new Error("cURL command is missing a URL.");

  const resolvedMethod = method ?? (bodyChunks.length > 0 ? "POST" : "GET");
  const { url: normalizedUrl, queryParams } = splitUrlAndQueryParams(url);
  const { body, auth } = inferBodyAndAuth(headers, bodyChunks, basicAuthValue);

  const request = createDefaultRequest();
  request.method = resolvedMethod;
  request.url = normalizedUrl;
  request.headers = headers;
  request.queryParams = queryParams;
  request.body = body;
  request.auth = auth;

  return {
    name: deriveRequestName(resolvedMethod, normalizedUrl),
    request,
  };
}
