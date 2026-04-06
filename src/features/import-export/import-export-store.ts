import { createSignal } from "solid-js";
import { pickOpenJsonFile, pickSaveJsonFile } from "~/lib/tauri";
import { exportWorkspaceBackupToFile, importWorkspaceBackupFromFile } from "./workspace-backup";

const [curlImportModalOpen, setCurlImportModalOpen] = createSignal(false);

export { curlImportModalOpen };

export function openCurlImportModal() {
  setCurlImportModalOpen(true);
}

export function closeCurlImportModal() {
  setCurlImportModalOpen(false);
}

export async function exportWorkspaceViaDialog(): Promise<void> {
  try {
    const targetPath = await pickSaveJsonFile(`pier-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`);
    if (!targetPath) return;
    await exportWorkspaceBackupToFile(targetPath);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Workspace export failed.");
  }
}

export async function importWorkspaceViaDialog(): Promise<void> {
  try {
    const sourcePath = await pickOpenJsonFile();
    if (!sourcePath) return;
    await importWorkspaceBackupFromFile(sourcePath);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Workspace import failed.");
  }
}
