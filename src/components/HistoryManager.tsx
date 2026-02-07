import { useState, useEffect } from 'react';
import { Trash2, Power, Clock, Moon, Sun } from 'lucide-react';
import BrowsingInsightsDashboard from './BrowsingInsightsDashboard';
import { CleanupRule, DEFAULT_CLEANUP_RULES } from '../services/StorageAnalyzer';
import SiteList from './manager/SiteList';
import TimerSettings from './manager/TimerSettings';
import CleanupRulesComponent from './manager/CleanupRules';

const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.history;

function isDomainMatch(domain: string, trackedSite: string): boolean {
  const d = domain.toLowerCase();
  const s = trackedSite.toLowerCase();
  return d === s || d === `www.${s}` || d.endsWith(`.${s}`);
}

interface HistoryManagerProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function HistoryManager({ darkMode, onToggleDarkMode }: HistoryManagerProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [targetSites, setTargetSites] = useState<string[]>([]);
  const [newSite, setNewSite] = useState('');
  const [autoCleanInterval, setAutoCleanInterval] = useState<number>(0); // 0 means disabled
  const [lastCleaned, setLastCleaned] = useState<string>('Never');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'manager' | 'insights'>('manager');
  const [timerActive, setTimerActive] = useState(false);
  const [triggerSite, setTriggerSite] = useState<string>('');
  const [nextCleaningTime, setNextCleaningTime] = useState<number>(0);
  const [cleanupRules, setCleanupRules] = useState<CleanupRule[]>(DEFAULT_CLEANUP_RULES);

  const settingsMap: Record<string, [() => any, (v: any) => void]> = {
    targetSites: [() => targetSites, setTargetSites],
    historyManagerEnabled: [() => isEnabled, setIsEnabled],
    autoCleanInterval: [() => autoCleanInterval, setAutoCleanInterval],
    lastCleaned: [() => lastCleaned, setLastCleaned],
    timerActive: [() => timerActive, setTimerActive],
    nextCleaningTime: [() => nextCleaningTime, setNextCleaningTime],
    triggerSite: [() => triggerSite, setTriggerSite],
    cleanupRules: [() => cleanupRules, setCleanupRules],
  };

  useEffect(() => {
    const keys = Object.keys(settingsMap);

    if (isExtension) {
      chrome.storage.sync.get(keys, (result: any) => {
        for (const key of keys) {
          if (result[key] !== undefined) {
            settingsMap[key][1](result[key]);
          }
        }
      });
    } else {
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          settingsMap[key][1](JSON.parse(stored));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isExtension) {
      const data: Record<string, any> = {};
      for (const key of Object.keys(settingsMap)) {
        data[key] = settingsMap[key][0]();
      }
      chrome.storage.sync.set(data);
    } else {
      for (const key of Object.keys(settingsMap)) {
        localStorage.setItem(key, JSON.stringify(settingsMap[key][0]()));
      }
    }
  }, [targetSites, isEnabled, autoCleanInterval, lastCleaned, timerActive, nextCleaningTime, triggerSite, cleanupRules]);

  useEffect(() => {
    if (!isEnabled || autoCleanInterval <= 0 || targetSites.length === 0 || !timerActive) {
      setTimeRemaining('');
      return;
    }

    function updateTimeRemaining() {
      const now = Date.now();
      if (now >= nextCleaningTime) return;

      const timeLeft = nextCleaningTime - now;
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }

    updateTimeRemaining();
    const intervalId = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [isEnabled, autoCleanInterval, targetSites, timerActive, nextCleaningTime]);

  function addSite() {
    if (newSite && !targetSites.includes(newSite)) {
      setTargetSites([...targetSites, newSite]);
      setNewSite('');
    }
  }

  function removeSite(site: string) {
    setTargetSites(targetSites.filter(s => s !== site));
    if (site === triggerSite) {
      resetTimer();
    }
  }

  function handleIntervalChange(value: number) {
    setAutoCleanInterval(value);
    if (timerActive) {
      resetTimer();
    }
  }

  async function clearHistory() {
    try {
      if (!isExtension) return;

      let totalCleared = 0;

      for (const site of targetSites) {
        const historyItems = await chrome.history.search({
          text: site,
          startTime: 0,
          endTime: Date.now(),
          maxResults: 10000
        });

        for (const item of historyItems) {
          if (!item.url) continue;
          try {
            const itemHostname = new URL(item.url).hostname;
            if (isDomainMatch(itemHostname, site)) {
              await chrome.history.deleteUrl({ url: item.url });
              totalCleared++;
            }
          } catch (urlError) {
            console.error('Error parsing URL:', item.url, urlError);
          }
        }
      }

      for (const rule of cleanupRules) {
        const ruleMatchesSite = targetSites.some(
          site => isDomainMatch(site, rule.domain) || isDomainMatch(rule.domain, site)
        );
        if (!ruleMatchesSite) continue;

        try {
          const tabs = await chrome.tabs.query({});
          for (const tab of tabs) {
            if (!tab.url || !tab.url.includes(rule.domain) || !tab.id) continue;
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (localKeys: string[], sessionKeys: string[]) => {
                  localKeys.forEach(key => localStorage.removeItem(key));
                  sessionKeys.forEach(key => sessionStorage.removeItem(key));
                },
                args: [rule.localStorageKeys, rule.sessionStorageKeys]
              });
            } catch (scriptError) {
              console.warn('Could not clear localStorage for tab:', tab.url, scriptError);
            }
          }
        } catch (error) {
          console.error(`Error clearing localStorage for ${rule.domain}:`, error);
        }
      }

      setLastCleaned(new Date().toISOString());
      resetTimer();

      alert(`Enhanced cleaning completed: ${totalCleared} history entries removed, plus storage cleanup rules applied.`);
    } catch (error: unknown) {
      console.error('Error clearing history:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error clearing history: ${errorMessage}`);
    }
  }

  function resetTimer() {
    if (isExtension) {
      chrome.storage.sync.set({
        timerActive: false,
        triggerSite: ''
      });
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20 ${activeTab === 'insights' ? 'w-[800px]' : 'w-96'}`}>
      <div className="flex border-b dark:border-gray-600">
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'manager'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('manager')}
        >
          History Manager
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'insights'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('insights')}
        >
          Storage Insights
        </button>
      </div>

      {activeTab === 'manager' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">History Manager</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-full transition-colors bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => {
                  const newState = !isEnabled;
                  setIsEnabled(newState);
                  if (!newState) {
                    resetTimer();
                  }
                }}
                className={`p-2 rounded-full transition-colors ${
                  isEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Power size={20} />
              </button>
            </div>
          </div>

          <SiteList
            targetSites={targetSites}
            newSite={newSite}
            onNewSiteChange={setNewSite}
            onAddSite={addSite}
            onRemoveSite={removeSite}
            triggerSite={triggerSite}
            timerActive={timerActive}
          />

          <TimerSettings
            autoCleanInterval={autoCleanInterval}
            onIntervalChange={handleIntervalChange}
            timeRemaining={timeRemaining}
            triggerSite={triggerSite}
            timerActive={timerActive}
            lastCleaned={lastCleaned}
            onResetTimer={resetTimer}
          />

          <CleanupRulesComponent
            cleanupRules={cleanupRules}
            onRulesChange={setCleanupRules}
          />

          <div className="flex gap-2">
            <button
              onClick={clearHistory}
              disabled={!isEnabled || targetSites.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
                isEnabled && targetSites.length > 0
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 size={20} />
              Clear History Now
            </button>

            {timerActive && (
              <button
                onClick={resetTimer}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Clock size={20} />
                Cancel Timer
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <BrowsingInsightsDashboard />
      )}
    </div>
  );
}
