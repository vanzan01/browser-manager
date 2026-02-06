import React, { useState, useEffect } from 'react';
import { Trash2, Power, Clock, Moon, Sun } from 'lucide-react';
import BrowsingInsightsDashboard from './BrowsingInsightsDashboard';
import { extractDomain, CleanupRule, DEFAULT_CLEANUP_RULES } from '../services/StorageAnalyzer';
import SiteList from './manager/SiteList';
import TimerSettings from './manager/TimerSettings';
import CleanupRulesComponent from './manager/CleanupRules';

const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.history;

// Helper function to check if a domain matches a tracked site
const isDomainMatch = (domain: string, trackedSite: string): boolean => {
  const domainLower = domain.toLowerCase();
  const siteLower = trackedSite.toLowerCase();

  return domainLower === siteLower ||
         domainLower === `www.${siteLower}` ||
         domainLower.endsWith(`.${siteLower}`);
};

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

  // Load saved settings
  useEffect(() => {
    if (isExtension) {
      // Load saved settings from chrome.storage
      chrome.storage.sync.get(['targetSites', 'historyManagerEnabled', 'autoCleanInterval', 'lastCleaned', 'timerActive', 'nextCleaningTime', 'triggerSite', 'cleanupRules'], (result: any) => {
        if (result.targetSites) {
          setTargetSites(result.targetSites);
        }
        if (result.historyManagerEnabled !== undefined) {
          setIsEnabled(result.historyManagerEnabled);
        }
        if (result.autoCleanInterval !== undefined) {
          setAutoCleanInterval(result.autoCleanInterval);
        }
        if (result.lastCleaned) {
          setLastCleaned(result.lastCleaned);
        }
        if (result.timerActive !== undefined) {
          setTimerActive(result.timerActive);
        }
        if (result.nextCleaningTime) {
          setNextCleaningTime(result.nextCleaningTime);
        }
        if (result.triggerSite) {
          setTriggerSite(result.triggerSite);
        }
        if (result.cleanupRules) {
          setCleanupRules(result.cleanupRules);
        }
      });
    } else {
      // Load from localStorage when running in development
      const savedSites = localStorage.getItem('targetSites');
      const savedEnabled = localStorage.getItem('historyManagerEnabled');
      const savedInterval = localStorage.getItem('autoCleanInterval');
      const savedLastCleaned = localStorage.getItem('lastCleaned');
      const savedTimerActive = localStorage.getItem('timerActive');
      const savedNextCleaningTime = localStorage.getItem('nextCleaningTime');
      const savedTriggerSite = localStorage.getItem('triggerSite');
      const savedCleanupRules = localStorage.getItem('cleanupRules');

      if (savedSites) {
        setTargetSites(JSON.parse(savedSites));
      }
      if (savedEnabled) {
        setIsEnabled(JSON.parse(savedEnabled));
      }
      if (savedInterval) {
        setAutoCleanInterval(JSON.parse(savedInterval));
      }
      if (savedLastCleaned) {
        setLastCleaned(JSON.parse(savedLastCleaned));
      }
      if (savedTimerActive) {
        setTimerActive(JSON.parse(savedTimerActive));
      }
      if (savedNextCleaningTime) {
        setNextCleaningTime(JSON.parse(savedNextCleaningTime));
      }
      if (savedTriggerSite) {
        setTriggerSite(JSON.parse(savedTriggerSite));
      }
      if (savedCleanupRules) {
        setCleanupRules(JSON.parse(savedCleanupRules));
      }
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (isExtension) {
      // Save settings to chrome.storage when they change
      chrome.storage.sync.set({
        targetSites,
        historyManagerEnabled: isEnabled,
        autoCleanInterval,
        lastCleaned,
        timerActive,
        nextCleaningTime,
        triggerSite,
        cleanupRules
      });
    } else {
      // Save to localStorage when running in development
      localStorage.setItem('targetSites', JSON.stringify(targetSites));
      localStorage.setItem('historyManagerEnabled', JSON.stringify(isEnabled));
      localStorage.setItem('autoCleanInterval', JSON.stringify(autoCleanInterval));
      localStorage.setItem('lastCleaned', JSON.stringify(lastCleaned));
      localStorage.setItem('timerActive', JSON.stringify(timerActive));
      localStorage.setItem('nextCleaningTime', JSON.stringify(nextCleaningTime));
      localStorage.setItem('triggerSite', JSON.stringify(triggerSite));
      localStorage.setItem('cleanupRules', JSON.stringify(cleanupRules));
    }
  }, [targetSites, isEnabled, autoCleanInterval, lastCleaned, timerActive, nextCleaningTime, triggerSite, cleanupRules]);

  // Automatic history cleaning timer display
  useEffect(() => {
    if (!isEnabled || autoCleanInterval <= 0 || targetSites.length === 0 || !timerActive) {
      setTimeRemaining('');
      return () => {};
    }

    // Update time remaining display
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      if (now >= nextCleaningTime) {
        return;
      }

      const timeLeft = nextCleaningTime - now;
      const minutes = Math.floor(timeLeft / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    // Initial update
    updateTimeRemaining();

    // Set interval to update countdown display
    const intervalId = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isEnabled, autoCleanInterval, targetSites, timerActive, nextCleaningTime]);

  const addSite = () => {
    if (newSite && !targetSites.includes(newSite)) {
      setTargetSites([...targetSites, newSite]);
      setNewSite('');
    }
  };

  const removeSite = (site: string) => {
    setTargetSites(targetSites.filter(s => s !== site));

    // If we remove a site that triggered the timer, reset the timer
    if (site === triggerSite) {
      resetTimer();
    }
  };

  const handleIntervalChange = (value: number) => {
    setAutoCleanInterval(value);
    // Reset timer if interval changes
    if (timerActive) {
      resetTimer();
    }
  };

  const clearHistory = async () => {
    try {
      if (!isExtension) {
        console.log('History clearing is only available in extension mode');
        return;
      }

      console.log('Starting enhanced history clearing for sites:', targetSites);
      let totalCleared = 0;

      // Clear data for each target site using enhanced deletion
      for (const site of targetSites) {
        console.log(`Processing site: ${site}`);

        // Clear history
        const historyItems = await chrome.history.search({
          text: site,
          startTime: 0,
          endTime: new Date().getTime(),
          maxResults: 10000
        });

        console.log(`Found ${historyItems.length} history items for ${site}`);

        for (const item of historyItems) {
          if (item.url) {
            try {
              const itemHostname = new URL(item.url).hostname.toLowerCase();
              const siteToMatch = site.toLowerCase();

              if (itemHostname === siteToMatch ||
                  itemHostname === `www.${siteToMatch}` ||
                  itemHostname.endsWith(`.${siteToMatch}`)) {
                await chrome.history.deleteUrl({ url: item.url });
                totalCleared++;
              }
            } catch (urlError) {
              console.error('Error parsing URL:', item.url, urlError);
            }
          }
        }

      }

      // Clear localStorage using cleanup rules
      for (const rule of cleanupRules) {
        if (targetSites.some(site => isDomainMatch(site, rule.domain) || isDomainMatch(rule.domain, site))) {
          try {
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
              if (tab.url && tab.url.includes(rule.domain) && tab.id) {
                try {
                  const lsKeys = rule.localStorageKeys;
                  const ssKeys = rule.sessionStorageKeys;
                  await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (localKeys: string[], sessionKeys: string[]) => {
                      localKeys.forEach(key => localStorage.removeItem(key));
                      sessionKeys.forEach(key => sessionStorage.removeItem(key));
                    },
                    args: [lsKeys, ssKeys]
                  });
                } catch (scriptError) {
                  console.warn('Could not clear localStorage for tab:', tab.url, scriptError);
                }
              }
            }
          } catch (error) {
            console.error(`Error clearing localStorage for ${rule.domain}:`, error);
          }
        }
      }

      // Update last cleaned time and reset timer
      const now = new Date();
      setLastCleaned(now.toISOString());
      resetTimer();

      console.log(`Total history entries cleared: ${totalCleared} (plus storage cleanup rules applied)`);
      alert(`Enhanced cleaning completed: ${totalCleared} history entries removed, plus storage cleanup rules applied.`);
    } catch (error: unknown) {
      console.error('Error clearing history:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error clearing history: ${errorMessage}`);
    }
  };

  // Function to reset the timer
  const resetTimer = () => {
    if (isExtension) {
      chrome.storage.sync.set({
        timerActive: false,
        triggerSite: ''
      });
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20 ${activeTab === 'insights' ? 'w-[800px]' : 'w-96'}`}>
      {/* Tabs */}
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

      {/* Manager Tab */}
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

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <BrowsingInsightsDashboard />
      )}
    </div>
  );
}
