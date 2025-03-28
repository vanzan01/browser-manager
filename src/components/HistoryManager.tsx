import React, { useState, useEffect } from 'react';
import { Trash2, Power, Plus, X, Clock, Database } from 'lucide-react';
import BrowsingInsightsDashboard from './BrowsingInsightsDashboard';
import { extractDomain } from '../services/StorageAnalyzer';

const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.history;

// Helper function to check if a domain matches a tracked site
const isDomainMatch = (domain: string, trackedSite: string): boolean => {
  const domainLower = domain.toLowerCase();
  const siteLower = trackedSite.toLowerCase();
  
  return domainLower === siteLower || 
         domainLower === `www.${siteLower}` || 
         domainLower.endsWith(`.${siteLower}`);
};

export default function HistoryManager() {
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

  // Load saved settings
  useEffect(() => {
    if (isExtension) {
      // Load saved settings from chrome.storage
      chrome.storage.sync.get(['targetSites', 'historyManagerEnabled', 'autoCleanInterval', 'lastCleaned', 'timerActive', 'nextCleaningTime', 'triggerSite'], (result: any) => {
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
        triggerSite
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
    }
  }, [targetSites, isEnabled, autoCleanInterval, lastCleaned, timerActive, nextCleaningTime, triggerSite]);

  // Setup tab navigation listener
  useEffect(() => {
    if (!isExtension || !isEnabled || autoCleanInterval <= 0 || targetSites.length === 0) {
      console.log('Tab monitoring disabled:', {
        isExtension,
        isEnabled,
        autoCleanInterval,
        targetSitesCount: targetSites.length
      });
      return;
    }

    console.log('Setting up tab monitoring with sites:', targetSites);

    const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // Only check when a URL change is complete
      if (changeInfo.status === 'complete' && tab.url) {
        try {
          const domain = extractDomain(tab.url);
          console.log(`Tab updated with URL: ${tab.url}, extracted domain: ${domain}`);
          
          // Check if domain matches any tracked site
          const isTrackedSite = targetSites.some(site => {
            const siteLower = site.toLowerCase();
            const domainLower = domain.toLowerCase();
            const isMatch = domainLower === siteLower || 
                   domainLower === `www.${siteLower}` || 
                   domainLower.endsWith(`.${siteLower}`);
            console.log(`Checking if ${domainLower} matches ${siteLower}: ${isMatch}`);
            return isMatch;
          });
          
          if (isTrackedSite && !timerActive) {
            console.log(`Visited tracked site: ${domain}, starting timer`);
            startTimer(domain);
          }
        } catch (error) {
          console.error('Error processing tab URL:', error);
        }
      }
    };

    const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) {
          const domain = extractDomain(tab.url);
          console.log(`Tab activated with URL: ${tab.url}, extracted domain: ${domain}`);
          
          // Check if domain matches any tracked site
          const isTrackedSite = targetSites.some(site => {
            const siteLower = site.toLowerCase();
            const domainLower = domain.toLowerCase();
            return domainLower === siteLower || 
                   domainLower === `www.${siteLower}` || 
                   domainLower.endsWith(`.${siteLower}`);
          });
          
          if (isTrackedSite && !timerActive) {
            console.log(`Activated tracked site: ${domain}, starting timer`);
            startTimer(domain);
          }
        }
      } catch (error) {
        console.error('Error handling tab activation:', error);
      }
    };

    // Register listeners
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener(handleTabUpdated);
      console.log('Registered tab update listener');
    }
    
    if (chrome.tabs && chrome.tabs.onActivated) {
      chrome.tabs.onActivated.addListener(handleTabActivated);
      console.log('Registered tab activation listener');
    }

    // Check currently active tab on setup
    const checkCurrentTab = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          console.log('Checking current active tab:', tab.url);
          handleTabUpdated(tab.id || 0, { status: 'complete' } as chrome.tabs.TabChangeInfo, tab);
        }
      } catch (error) {
        console.error('Error checking current tab:', error);
      }
    };
    checkCurrentTab();

    return () => {
      if (chrome.tabs && chrome.tabs.onUpdated) {
        chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      }
      if (chrome.tabs && chrome.tabs.onActivated) {
        chrome.tabs.onActivated.removeListener(handleTabActivated);
      }
      console.log('Cleaned up tab listeners');
    };
  }, [isEnabled, autoCleanInterval, targetSites, timerActive]);

  // Automatic history cleaning timer
  useEffect(() => {
    if (!isEnabled || autoCleanInterval <= 0 || targetSites.length === 0 || !timerActive) {
      setTimeRemaining('');
      return () => {};
    }

    // Update time remaining display
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      if (now >= nextCleaningTime) {
        clearHistory();
        return;
      }

      const timeLeft = nextCleaningTime - now;
      const minutes = Math.floor(timeLeft / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
      
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    // Initial update
    updateTimeRemaining();

    // Set interval to update countdown and check if cleaning is needed
    const intervalId = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isEnabled, autoCleanInterval, targetSites, timerActive, nextCleaningTime]);

  // Function to start the timer
  const startTimer = (domain: string) => {
    const now = new Date().getTime();
    const cleanTime = now + (autoCleanInterval * 60 * 1000);
    
    setNextCleaningTime(cleanTime);
    setTimerActive(true);
    setTriggerSite(domain);
    
    console.log(`Timer started, will clean in ${autoCleanInterval} minutes`);
  };

  // Function to reset the timer
  const resetTimer = () => {
    setTimerActive(false);
    setTimeRemaining('');
    setTriggerSite('');
  };

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

  const clearHistory = async () => {
    try {
      if (!isExtension) {
        console.log('History clearing is only available in extension mode');
        return;
      }

      // Remove time restriction - clear all history
      const startTime = 0;
      const endTime = new Date().getTime();
      
      console.log('Starting history clearing for sites:', targetSites);
      let totalCleared = 0;

      // Search for history entries from target sites
      for (const site of targetSites) {
        console.log(`Searching for history entries containing: ${site}`);
        const historyItems = await chrome.history.search({
          text: site,
          startTime: startTime,
          endTime: endTime,
          maxResults: 10000 // Increase max results
        });

        console.log(`Found ${historyItems.length} items for ${site}`);

        // Delete found history entries
        for (const item of historyItems) {
          if (item.url) {
            try {
              // Improved domain matching - handle both with and without www prefix
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
      
      // Update last cleaned time and reset timer
      const now = new Date();
      setLastCleaned(now.toISOString());
      resetTimer();
      
      console.log(`Total history entries cleared: ${totalCleared}`);
      alert(`History cleared: ${totalCleared} entries removed.`);
    } catch (error: unknown) {
      console.error('Error clearing history:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error clearing history: ${errorMessage}`);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${activeTab === 'insights' ? 'w-[800px]' : 'w-96'}`}>
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'manager' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('manager')}
        >
          History Manager
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'insights' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
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
            <h1 className="text-2xl font-bold text-gray-800">History Manager</h1>
            <button
              onClick={() => {
                const newState = !isEnabled;
                setIsEnabled(newState);
                if (!newState) {
                  resetTimer();
                }
              }}
              className={`p-2 rounded-full transition-colors ${
                isEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Power size={20} />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                placeholder="Enter domain (e.g., example.com)"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addSite}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {targetSites.map((site) => (
                <div
                  key={site}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    site === triggerSite && timerActive 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-gray-700">{site}</span>
                    {site === triggerSite && timerActive && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeSite(site)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Clean Timer Settings */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-700 flex items-center gap-1">
                <Clock size={16} />
                Auto-Clean Timer (minutes)
              </label>
              {timeRemaining && (
                <div className="text-sm text-blue-600 font-medium">
                  Next clean: {timeRemaining}
                </div>
              )}
            </div>
            
            <div className="mb-2 text-sm text-gray-600">
              Timer will start when you visit one of the tracked sites
              {triggerSite && timerActive && (
                <span className="block mt-1 text-blue-600">
                  Currently triggered by: {triggerSite}
                </span>
              )}
            </div>
            
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={autoCleanInterval}
              onChange={(e) => {
                setAutoCleanInterval(parseInt(e.target.value));
                // Reset timer if interval changes
                if (timerActive) {
                  resetTimer();
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Off</span>
              <span>{autoCleanInterval > 0 ? `${autoCleanInterval} min` : 'Disabled'}</span>
              <span>120 min</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last cleaned: {lastCleaned === 'Never' ? 'Never' : new Date(lastCleaned).toLocaleString()}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearHistory}
              disabled={!isEnabled || targetSites.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
                isEnabled && targetSites.length > 0
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Trash2 size={20} />
              Clear History Now
            </button>
            
            {timerActive && (
              <button
                onClick={resetTimer}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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