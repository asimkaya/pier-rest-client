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
import { createDefaultRequest } from "~/lib/types";
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

const [state, setState] = createStore<AppState>({
  tabs: [],
  activeTabId: "",
  collections: [],
  savedRequests: [],
  environments: [],
  activeEnvironmentId: null,
  history: [],
  sidebarView: "collections",
  sidebarWidth: 330,
  theme: "system",
});

export { state, setState };

export function getActiveTab(): Tab | undefined {
  return state.tabs.find((t) => t.id === state.activeTabId);
}

// Tab actions
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

export function closeTabsForRequestId(requestId: string) {
  const ids = state.tabs.filter((t) => t.savedLocation?.requestId === requestId).map((t) => t.id);
  for (const tabId of ids) {
    closeTab(tabId);
  }
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

function savedLocationEquals(a: SavedLocation | undefined, b: SavedLocation | undefined): boolean {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === "standalone") return a.requestId === b.requestId;
  return (
    a.collectionId === b.collectionId &&
    (a.folderId ?? "") === (b.folderId ?? "") &&
    a.requestId === b.requestId
  );
}

export function openRequestInTab(config: RequestConfig, name: string, savedLocation?: SavedLocation) {
  let returnId = "";
  setState(
    produce((s) => {
      if (savedLocation) {
        const existing = s.tabs.find((t) => savedLocationEquals(t.savedLocation, savedLocation));
        if (existing) {
          s.activeTabId = existing.id;
          returnId = existing.id;
          return;
        }
      }
      const id = generateId();
      returnId = id;
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
  return returnId;
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

/** When a standalone saved request is moved into a collection, keep open tabs in sync. */
export function retargetStandaloneSavedTabs(requestId: string, location: SavedLocation) {
  setState(
    produce((s) => {
      for (const tab of s.tabs) {
        if (tab.savedLocation?.type === "standalone" && tab.savedLocation.requestId === requestId) {
          tab.savedLocation = location;
          tab.isDirty = false;
        }
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
