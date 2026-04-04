import { createStore, produce } from "solid-js/store";
import type {
  Tab,
  Collection,
  Environment,
  RequestLog,
  SidebarView,
  ThemeMode,
  RequestConfig,
  ResponseData,
  SavedLocation,
  SavedRequest,
} from "~/lib/types";
import { createDefaultTab, createDefaultRequest } from "~/lib/types";
import { generateId } from "~/lib/utils";

interface AppState {
  tabs: Tab[];
  activeTabId: string;
  collections: Collection[];
  savedRequests: SavedRequest[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  history: RequestLog[];
  sidebarView: SidebarView;
  sidebarWidth: number;
  theme: ThemeMode;
}

const initialTabId = generateId();

const [state, setState] = createStore<AppState>({
  tabs: [createDefaultTab(initialTabId)],
  activeTabId: initialTabId,
  collections: [],
  savedRequests: [],
  environments: [],
  activeEnvironmentId: null,
  history: [],
  sidebarView: "collections",
  sidebarWidth: 260,
  theme: "system",
});

export { state, setState };

export function getActiveTab(): Tab | undefined {
  return state.tabs.find((t) => t.id === state.activeTabId);
}

// Tab actions
export function addTab() {
  const id = generateId();
  const tab = createDefaultTab(id);
  setState(
    produce((s) => {
      s.tabs.push(tab);
      s.activeTabId = id;
    })
  );
  return id;
}

export function closeTab(id: string) {
  setState(
    produce((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return;
      s.tabs.splice(idx, 1);
      if (s.tabs.length === 0) {
        s.activeTabId = "";
      } else if (s.activeTabId === id) {
        s.activeTabId = s.tabs[Math.min(idx, s.tabs.length - 1)].id;
      }
    })
  );
}

export function setActiveTab(id: string) {
  setState("activeTabId", id);
}

export function renameTab(id: string, name: string) {
  setState(
    produce((s) => {
      const tab = s.tabs.find((t) => t.id === id);
      if (tab) tab.name = name;
    })
  );
}

export function updateTabRequest(id: string, partial: Partial<RequestConfig>) {
  setState(
    produce((s) => {
      const tab = s.tabs.find((t) => t.id === id);
      if (tab) {
        Object.assign(tab.request, partial);
        tab.isDirty = true;
      }
    })
  );
}

export function setTabResponse(id: string, response: ResponseData | null) {
  setState(
    produce((s) => {
      const tab = s.tabs.find((t) => t.id === id);
      if (tab) {
        tab.response = response;
        tab.isLoading = false;
      }
    })
  );
}

export function setTabLoading(id: string, loading: boolean) {
  setState(
    produce((s) => {
      const tab = s.tabs.find((t) => t.id === id);
      if (tab) tab.isLoading = loading;
    })
  );
}

export function setTabDirty(id: string, dirty: boolean) {
  setState(
    produce((s) => {
      const tab = s.tabs.find((t) => t.id === id);
      if (tab) tab.isDirty = dirty;
    })
  );
}

export function openRequestInTab(config: RequestConfig, name: string, savedLocation?: SavedLocation) {
  const id = generateId();
  setState(
    produce((s) => {
      s.tabs.push({
        id,
        name,
        request: { ...createDefaultRequest(), ...config },
        response: null,
        isDirty: false,
        isLoading: false,
        savedLocation,
      });
      s.activeTabId = id;
    })
  );
  return id;
}

export function setTabSavedLocation(tabId: string, location: SavedLocation) {
  setState(
    produce((s) => {
      const tab = s.tabs.find((t) => t.id === tabId);
      if (tab) {
        tab.savedLocation = location;
        tab.isDirty = false;
      }
    })
  );
}

// Sidebar
export function setSidebarView(view: SidebarView) {
  setState("sidebarView", view);
}

export function setSidebarWidth(width: number) {
  setState("sidebarWidth", Math.max(200, Math.min(400, width)));
}

// Theme
export function setTheme(theme: ThemeMode) {
  setState("theme", theme);
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
}

// Collections
export function setCollections(collections: Collection[]) {
  setState("collections", collections);
}

// Saved Requests (standalone)
export function setSavedRequests(requests: SavedRequest[]) {
  setState("savedRequests", requests);
}

// Environments
export function setEnvironments(environments: Environment[]) {
  setState("environments", environments);
}

export function setActiveEnvironment(id: string | null) {
  setState("activeEnvironmentId", id);
}

// History
export function addHistoryEntry(entry: RequestLog) {
  setState(
    produce((s) => {
      s.history.unshift(entry);
      if (s.history.length > 100) s.history.length = 100;
    })
  );
}

export function clearHistory() {
  setState("history", []);
}

export function setHistory(history: RequestLog[]) {
  setState("history", history);
}
