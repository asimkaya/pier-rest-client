import { setEnvironments, setActiveEnvironment, state, setState } from "~/store/app-store";
import { readJsonFile, writeJsonFile } from "~/lib/tauri";
import type { Environment, EnvironmentVariable } from "~/lib/types";
import { generateId } from "~/lib/utils";
import { produce } from "solid-js/store";

const ENV_PATH = "environments/environments.json";

export async function loadEnvironments(): Promise<void> {
  try {
    const data = await readJsonFile<Environment[]>(ENV_PATH);
    setEnvironments(data ?? []);
  } catch {
    setEnvironments([]);
  }
}

async function saveEnvironments(): Promise<void> {
  await writeJsonFile(ENV_PATH, state.environments);
}

export async function createEnvironment(name: string): Promise<Environment> {
  const env: Environment = {
    id: generateId(),
    name,
    variables: [],
  };
  setEnvironments([...state.environments, env]);
  await saveEnvironments();
  return env;
}

export async function updateEnvironmentVariable(
  envId: string,
  varIndex: number,
  field: keyof EnvironmentVariable,
  value: string | boolean
): Promise<void> {
  const envIndex = state.environments.findIndex((e) => e.id === envId);
  if (envIndex === -1) return;
  setState("environments", envIndex, "variables", varIndex, field as any, value as any);
  await saveEnvironments();
}

export async function addVariableToEnvironment(envId: string): Promise<void> {
  const envIndex = state.environments.findIndex((e) => e.id === envId);
  if (envIndex === -1) return;
  setState("environments", envIndex, "variables", (vars: EnvironmentVariable[]) => [
    ...vars,
    { key: "", value: "", enabled: true },
  ]);
  await saveEnvironments();
}

export async function removeVariableFromEnvironment(envId: string, varIndex: number): Promise<void> {
  const envIndex = state.environments.findIndex((e) => e.id === envId);
  if (envIndex === -1) return;
  setState(
    produce((s) => {
      s.environments[envIndex].variables.splice(varIndex, 1);
    })
  );
  await saveEnvironments();
}

export async function renameEnvironment(id: string, name: string): Promise<void> {
  const idx = state.environments.findIndex((e) => e.id === id);
  if (idx === -1) return;
  setState("environments", idx, "name", name);
  await saveEnvironments();
}

export async function deleteEnvironment(id: string): Promise<void> {
  setEnvironments(state.environments.filter((e) => e.id !== id));
  if (state.activeEnvironmentId === id) {
    setActiveEnvironment(null);
  }
  await saveEnvironments();
}

export function getActiveEnvironmentVariables(): Record<string, string> {
  if (!state.activeEnvironmentId) return {};
  const env = state.environments.find((e) => e.id === state.activeEnvironmentId);
  if (!env) return {};
  const vars: Record<string, string> = {};
  for (const v of env.variables) {
    if (v.enabled) vars[v.key] = v.value;
  }
  return vars;
}
