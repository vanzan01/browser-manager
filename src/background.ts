interface CleanupRule {
  domain: string;
  localStorageKeys: string[];
  sessionStorageKeys: string[];
}

const DEFAULT_CLEANUP_RULES: CleanupRule[] = [
  {
    domain: 'reddit.com',
    localStorageKeys: ['recent-subreddits-store'],
    sessionStorageKeys: ['recent-subreddits-store'],
  }
];

interface Settings {
  isEnabled: boolean;
  targetSites: string[];
  autoCleanInterval: number;
  timerActive: boolean;
  nextCleaningTime: number;
  triggerSite: string;
  cleanupRules: CleanupRule[];
}

let settings: Settings = {
  isEnabled: false,
  targetSites: [],
  autoCleanInterval: 0,
  timerActive: false,
  nextCleaningTime: 0,
  triggerSite: '',
  cleanupRules: DEFAULT_CLEANUP_RULES
};

// Load settings when the service worker starts
chrome.storage.sync.get([
  'targetSites',
  'historyManagerEnabled',
  'autoCleanInterval',
  'timerActive',
  'nextCleaningTime',
  'triggerSite',
  'cleanupRules'
], (result: { [key: string]: unknown }) => {
  settings = {
    isEnabled: (result.historyManagerEnabled as boolean) || false,
    targetSites: (result.targetSites as string[]) || [],
    autoCleanInterval: (result.autoCleanInterval as number) || 0,
    timerActive: (result.timerActive as boolean) || false,
    nextCleaningTime: (result.nextCleaningTime as number) || 0,
    triggerSite: (result.triggerSite as string) || '',
    cleanupRules: (result.cleanupRules as CleanupRule[]) || DEFAULT_CLEANUP_RULES
  };
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
  if (namespace === 'sync') {
    if (changes.historyManagerEnabled) settings.isEnabled = changes.historyManagerEnabled.newValue;
    if (changes.targetSites) settings.targetSites = changes.targetSites.newValue;
    if (changes.autoCleanInterval) settings.autoCleanInterval = changes.autoCleanInterval.newValue;
    if (changes.timerActive) settings.timerActive = changes.timerActive.newValue;
    if (changes.nextCleaningTime) settings.nextCleaningTime = changes.nextCleaningTime.newValue;
    if (changes.triggerSite) settings.triggerSite = changes.triggerSite.newValue;
    if (changes.cleanupRules) settings.cleanupRules = changes.cleanupRules.newValue;
  }
});

// Helper function to extract domain
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// Helper function to check if a domain matches a tracked site
function isDomainMatch(domain: string, trackedSite: string): boolean {
  const domainLower = domain.toLowerCase();
  const siteLower = trackedSite.toLowerCase();
  return domainLower === siteLower ||
         domainLower === `www.${siteLower}` ||
         domainLower.endsWith(`.${siteLower}`);
}

// Function to start the timer
function startTimer(domain: string): void {
  const now = new Date().getTime();
  const cleanTime = now + (settings.autoCleanInterval * 60 * 1000);

  chrome.storage.sync.set({
    nextCleaningTime: cleanTime,
    timerActive: true,
    triggerSite: domain
  });
}

// Function to clear history and other data
async function clearHistory(): Promise<void> {
  try {
    let totalCleared = 0;

    // Clear data for each target site using enhanced deletion
    for (const site of settings.targetSites) {
      // Clear history
      const historyItems = await chrome.history.search({
        text: site,
        startTime: 0,
        endTime: new Date().getTime(),
        maxResults: 10000
      });

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

    // Clear localStorage using configurable cleanup rules
    for (const rule of settings.cleanupRules) {
      const ruleMatchesSite = settings.targetSites.some(
        site => isDomainMatch(site, rule.domain) || isDomainMatch(rule.domain, site)
      );
      if (!ruleMatchesSite) continue;

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

    // Reset timer state
    chrome.storage.sync.set({
      timerActive: false,
      triggerSite: '',
      lastCleaned: new Date().toISOString()
    });

    console.log(`Cleared ${totalCleared} history entries and applied cleanup rules`);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

// Check timer and clear history if needed
function checkTimer(): void {
  if (!settings.isEnabled || !settings.timerActive || settings.autoCleanInterval <= 0) {
    return;
  }

  const now = new Date().getTime();
  if (now >= settings.nextCleaningTime) {
    clearHistory();
  }
}

// Set up periodic timer check
setInterval(checkTimer, 1000);

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  if (!settings.isEnabled || settings.autoCleanInterval <= 0 || settings.targetSites.length === 0 || settings.timerActive) {
    return;
  }

  if (changeInfo.status === 'complete' && tab.url) {
    const domain = extractDomain(tab.url);
    const isTrackedSite = settings.targetSites.some(site => isDomainMatch(domain, site));

    if (isTrackedSite) {
      startTimer(domain);
    }
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.TabActiveInfo) => {
  if (!settings.isEnabled || settings.autoCleanInterval <= 0 || settings.targetSites.length === 0 || settings.timerActive) {
    return;
  }

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const domain = extractDomain(tab.url);
      const isTrackedSite = settings.targetSites.some(site => isDomainMatch(domain, site));

      if (isTrackedSite) {
        startTimer(domain);
      }
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});
