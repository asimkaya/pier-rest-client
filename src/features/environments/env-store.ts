import { setEnvironments, setActiveEnvironment, state } from "~/store/app-store";
import { readJsonFile, writeJsonFile } from "~/lib/tauri";
import type { Environment, EnvironmentVariable } from "~/lib/types";
import { generateId } from "~/lib/utils";

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

export async function updateEnvironment(id: string, updates: Partial<Environment>): Promise<void> {
  setEnvironments(
    state.environments.map((e) => (e.id === id ? { ...e, ...updates } : e))
  );
  await saveEnvironments();
}

export async function deleteEnvironment(id: string): Promise<void> {
  setEnvironments(state.environments.filter((e) => e.id !== id));
  if (state.activeEnvironmentId === id) {
    setActiveEnvironment(null);
  }
  await saveEnvironments();
}

export async function addVariable(envId: string, variable: EnvironmentVariable): Promise<void> {
  const env = state.environments.find((e) => e.id === envId);
  if (!env) return;
  await updateEnvironment(envId, { variables: [...env.variables, variable] });
}

export async function removeVariable(envId: string, key: string): Promise<void> {
  const env = state.environments.find((e) => e.id === envId);
  if (!env) return;
  await updateEnvironment(envId, {
    variables: env.variables.filter((v) => v.key !== key),
  });
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
