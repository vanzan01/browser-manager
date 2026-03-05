import { useState, useEffect, useCallback } from 'react';
import { Database, Trash2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

interface StorageEntry {
  key: string;
  value: string;
  type: 'local' | 'session';
}

interface DomainStorageData {
  domain: string;
  tabId: number;
  local: StorageEntry[];
  session: StorageEntry[];
}

interface StorageBrowserProps {
  targetSites: string[];
}

const isExtension =
  typeof chrome !== 'undefined' && !!chrome.scripting && !!chrome.tabs;

function isDomainMatch(domain: string, trackedSite: string): boolean {
  const d = domain.toLowerCase();
  const s = trackedSite.toLowerCase();
  return d === s || d === `www.${s}` || d.endsWith(`.${s}`);
}

function formatValue(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function StorageBrowser({ targetSites }: StorageBrowserProps) {
  const [storageData, setStorageData] = useState<DomainStorageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set());

  const fetchStorageData = useCallback(async () => {
    if (!isExtension || targetSites.length === 0) return;

    setLoading(true);
    try {
      const allTabs = await chrome.tabs.query({});
      const results: DomainStorageData[] = [];

      for (const tab of allTabs) {
        if (!tab.url || !tab.id) continue;

        let tabDomain: string;
        try {
          tabDomain = new URL(tab.url).hostname;
        } catch {
          continue;
        }

        const matchedSite = targetSites.find((site) =>
          isDomainMatch(tabDomain, site)
        );
        if (!matchedSite) continue;

        try {
          const execResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const local = Object.keys(localStorage).map((key) => ({
                key,
                value: localStorage.getItem(key) || '',
                type: 'local' as const,
              }));
              const session = Object.keys(sessionStorage).map((key) => ({
                key,
                value: sessionStorage.getItem(key) || '',
                type: 'session' as const,
              }));
              return { local, session };
            },
          });

          if (execResults?.[0]?.result) {
            const { local, session } = execResults[0].result;
            // Skip if no storage entries at all
            if (local.length === 0 && session.length === 0) continue;

            // Deduplicate: if we already have data for this domain (localStorage is shared per origin), skip
            const alreadyHasDomain = results.some(
              (r) => r.domain === matchedSite
            );
            if (alreadyHasDomain) continue;

            results.push({
              domain: matchedSite,
              tabId: tab.id,
              local,
              session,
            });
          }
        } catch {
          // Skip tabs where injection fails (chrome://, extension pages, etc.)
        }
      }

      setStorageData(results);
    } catch (err) {
      console.error('Failed to fetch storage data:', err);
    } finally {
      setLoading(false);
    }
  }, [targetSites]);

  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  const deleteKey = async (
    tabId: number,
    key: string,
    type: 'local' | 'session'
  ) => {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (keyToDelete: string, storageType: string) => {
          if (storageType === 'local') {
            localStorage.removeItem(keyToDelete);
          } else {
            sessionStorage.removeItem(keyToDelete);
          }
        },
        args: [key, type],
      });
      // Remove from expanded set
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        next.delete(`${tabId}:${type}:${key}`);
        return next;
      });
      await fetchStorageData();
    } catch (err) {
      console.error(`Failed to delete key "${key}":`, err);
    }
  };

  const toggleKey = (compositeKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(compositeKey)) {
        next.delete(compositeKey);
      } else {
        next.add(compositeKey);
      }
      return next;
    });
  };

  const toggleDomain = (domain: string) => {
    setCollapsedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  const renderEntries = (
    entries: StorageEntry[],
    tabId: number,
    label: string
  ) => {
    if (entries.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </div>
        <div className="space-y-1">
          {entries.map((entry) => {
            const compositeKey = `${tabId}:${entry.type}:${entry.key}`;
            const isExpanded = expandedKeys.has(compositeKey);
            return (
              <div key={compositeKey}>
                <div className="flex items-center justify-between group">
                  <button
                    onClick={() => toggleKey(compositeKey)}
                    className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-left min-w-0 flex-1"
                  >
                    {isExpanded ? (
                      <ChevronDown size={12} className="flex-shrink-0" />
                    ) : (
                      <ChevronRight size={12} className="flex-shrink-0" />
                    )}
                    <span className="truncate">{entry.key}</span>
                  </button>
                  <button
                    onClick={() => deleteKey(tabId, entry.key, entry.type)}
                    className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {isExpanded && (
                  <pre className="mt-1 ml-4 p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded max-h-40 overflow-auto whitespace-pre-wrap break-all text-gray-600 dark:text-gray-400">
                    {formatValue(entry.value)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isExtension) {
    return (
      <div className="mb-4">
        <label className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
          <Database size={16} />
          Storage Browser
        </label>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Storage browser is only available when running as a browser extension.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
        <Database size={16} />
        Storage Browser
        <button
          onClick={fetchStorageData}
          disabled={loading}
          className="ml-auto text-gray-500 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </label>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Browse localStorage/sessionStorage for tracked sites
      </div>

      {loading && storageData.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
          Scanning open tabs...
        </div>
      )}

      {!loading && storageData.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
          No open tabs found for tracked sites.
        </div>
      )}

      <div className="space-y-2">
        {storageData.map((data) => {
          const isCollapsed = collapsedDomains.has(data.domain);
          return (
            <div
              key={data.domain}
              className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-sm"
            >
              <button
                onClick={() => toggleDomain(data.domain)}
                className="flex items-center gap-1 w-full text-left"
              >
                {isCollapsed ? (
                  <ChevronRight size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {data.domain}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({data.local.length} local, {data.session.length} session)
                </span>
              </button>

              {!isCollapsed && (
                <>
                  {renderEntries(data.local, data.tabId, 'localStorage')}
                  {renderEntries(data.session, data.tabId, 'sessionStorage')}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StorageBrowser;
