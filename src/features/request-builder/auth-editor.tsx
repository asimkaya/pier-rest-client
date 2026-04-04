import { Show } from "solid-js";
import { Input } from "~/components/ui/input";
import type { AuthConfig, AuthType, ApiKeyLocation } from "~/lib/types";
import { cn } from "~/lib/utils";

interface AuthEditorProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const authTypes: { value: AuthType; label: string }[] = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "apiKey", label: "API Key" },
];

export function AuthEditor(props: AuthEditorProps) {
  function setType(type: AuthType) {
    props.onChange({ ...props.auth, type });
  }

  function updateBearer(token: string) {
    props.onChange({ ...props.auth, bearer: { token } });
  }

  function updateBasic(field: "username" | "password", value: string) {
    props.onChange({ ...props.auth, basic: { ...props.auth.basic, [field]: value } });
  }

  function updateApiKey(field: "key" | "value" | "location", val: string) {
    if (field === "location") {
      props.onChange({
        ...props.auth,
        apiKey: { ...props.auth.apiKey, location: val as ApiKeyLocation },
      });
    } else {
      props.onChange({
        ...props.auth,
        apiKey: { ...props.auth.apiKey, [field]: val },
      });
    }
  }

  return (
    <div class="space-y-3 p-3">
      <div class="flex gap-1">
        {authTypes.map((at) => (
          <button
            class={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              props.auth.type === at.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setType(at.value)}
          >
            {at.label}
          </button>
        ))}
      </div>

      <Show when={props.auth.type === "bearer"}>
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted-foreground">Token</label>
          <Input
            value={props.auth.bearer.token}
            onInput={(e) => updateBearer(e.currentTarget.value)}
            placeholder="Enter bearer token or {{variable}}"
            class="font-mono text-xs"
          />
        </div>
      </Show>

      <Show when={props.auth.type === "basic"}>
        <div class="space-y-2">
          <div>
            <label class="text-xs font-medium text-muted-foreground">Username</label>
            <Input
              value={props.auth.basic.username}
              onInput={(e) => updateBasic("username", e.currentTarget.value)}
              placeholder="Username"
              class="mt-1 text-xs"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground">Password</label>
            <Input
              type="password"
              value={props.auth.basic.password}
              onInput={(e) => updateBasic("password", e.currentTarget.value)}
              placeholder="Password"
              class="mt-1 text-xs"
            />
          </div>
        </div>
      </Show>

      <Show when={props.auth.type === "apiKey"}>
        <div class="space-y-2">
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs font-medium text-muted-foreground">Key</label>
              <Input
                value={props.auth.apiKey.key}
                onInput={(e) => updateApiKey("key", e.currentTarget.value)}
                placeholder="X-API-Key"
                class="mt-1 text-xs"
              />
            </div>
            <div class="flex-1">
              <label class="text-xs font-medium text-muted-foreground">Value</label>
              <Input
                value={props.auth.apiKey.value}
                onInput={(e) => updateApiKey("value", e.currentTarget.value)}
                placeholder="API key value"
                class="mt-1 text-xs"
              />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground">Add to</label>
            <div class="mt-1 flex gap-1">
              <button
                class={cn(
                  "rounded-md px-3 py-1.5 text-xs transition-colors",
                  props.auth.apiKey.location === "header"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => updateApiKey("location", "header")}
              >
                Header
              </button>
              <button
                class={cn(
                  "rounded-md px-3 py-1.5 text-xs transition-colors",
                  props.auth.apiKey.location === "queryParam"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => updateApiKey("location", "queryParam")}
              >
                Query Param
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={props.auth.type === "none"}>
        <p class="text-xs text-muted-foreground">
          No authentication will be applied to this request.
        </p>
      </Show>
    </div>
  );
}
