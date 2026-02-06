let settings = {
  isEnabled: false,
  targetSites: [],
  autoCleanInterval: 0,
  timerActive: false,
  nextCleaningTime: 0,
  triggerSite: ''
};

// Load settings when the service worker starts
chrome.storage.sync.get([
  'targetSites',
  'historyManagerEnabled',
  'autoCleanInterval',
  'timerActive',
  'nextCleaningTime',
  'triggerSite'
], (result) => {
  settings = {
    isEnabled: result.historyManagerEnabled || false,
    targetSites: result.targetSites || [],
    autoCleanInterval: result.autoCleanInterval || 0,
    timerActive: result.timerActive || false,
    nextCleaningTime: result.nextCleaningTime || 0,
    triggerSite: result.triggerSite || ''
  };
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.historyManagerEnabled) settings.isEnabled = changes.historyManagerEnabled.newValue;
    if (changes.targetSites) settings.targetSites = changes.targetSites.newValue;
    if (changes.autoCleanInterval) settings.autoCleanInterval = changes.autoCleanInterval.newValue;
    if (changes.timerActive) settings.timerActive = changes.timerActive.newValue;
    if (changes.nextCleaningTime) settings.nextCleaningTime = changes.nextCleaningTime.newValue;
    if (changes.triggerSite) settings.triggerSite = changes.triggerSite.newValue;
  }
});

// Helper function to extract domain
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// Helper function to check if a domain matches a tracked site
function isDomainMatch(domain, trackedSite) {
  const domainLower = domain.toLowerCase();
  const siteLower = trackedSite.toLowerCase();
  return domainLower === siteLower || 
         domainLower === `www.${siteLower}` || 
         domainLower.endsWith(`.${siteLower}`);
}

// Function to start the timer
function startTimer(domain) {
  const now = new Date().getTime();
  const cleanTime = now + (settings.autoCleanInterval * 60 * 1000);
  
  chrome.storage.sync.set({
    nextCleaningTime: cleanTime,
    timerActive: true,
    triggerSite: domain
  });
}

// Function to clear history and other data
async function clearHistory() {
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

      // Clear localStorage for Reddit specifically - ONLY the recent subreddits data
      if (site.includes('reddit.com') || site === 'reddit.com' || site === 'www.reddit.com') {
        console.log('Attempting to clear ONLY Reddit recent subreddits localStorage for site:', site);
        try {
          const tabs = await chrome.tabs.query({});
          console.log(`Found ${tabs.length} tabs to check for Reddit`);
          
          for (const tab of tabs) {
            if (tab.url && (tab.url.includes('reddit.com') || tab.url.includes('www.reddit.com')) && tab.id) {
              console.log('Clearing ONLY recent subreddits localStorage for Reddit tab:', tab.url);
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: () => {
                    console.log('Executing PRECISE localStorage clearing script on Reddit tab');
                    
                    // Check if the key exists first
                    const targetKey = 'recent-subreddits-store';
                    const keyExists = localStorage.getItem(targetKey) !== null;
                    console.log(`Key "${targetKey}" exists: ${keyExists}`);
                    
                    if (keyExists) {
                      localStorage.removeItem(targetKey);
                      console.log(`Successfully removed localStorage key: ${targetKey}`);
                    } else {
                      console.log(`Key "${targetKey}" not found in localStorage`);
                    }
                    
                    // Also check sessionStorage for the same key
                    const sessionKeyExists = sessionStorage.getItem(targetKey) !== null;
                    console.log(`SessionStorage key "${targetKey}" exists: ${sessionKeyExists}`);
                    
                    if (sessionKeyExists) {
                      sessionStorage.removeItem(targetKey);
                      console.log(`Successfully removed sessionStorage key: ${targetKey}`);
                    }
                    
                    // List all localStorage keys for debugging (without removing them)
                    const allKeys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      allKeys.push(localStorage.key(i));
                    }
                    console.log('All localStorage keys:', allKeys);
                  }
                });
                console.log('Successfully executed precise localStorage clearing script');
              } catch (scriptError) {
                console.warn('Could not clear localStorage for tab:', tab.url, scriptError);
              }
            }
          }
        } catch (error) {
          console.error('Error clearing localStorage for Reddit:', error);
        }
      }
    }

    // Reset timer state
    chrome.storage.sync.set({
      timerActive: false,
      triggerSite: '',
      lastCleaned: new Date().toISOString()
    });

    console.log(`Cleared ${totalCleared} history entries and Reddit recent subreddits data`);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

// Check timer and clear history if needed
function checkTimer() {
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
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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
chrome.tabs.onActivated.addListener(async (activeInfo) => {
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