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

// Function to clear history
async function clearHistory() {
  try {
    const startTime = 0;
    const endTime = new Date().getTime();
    let totalCleared = 0;

    // Search and delete history entries for each target site
    for (const site of settings.targetSites) {
      const historyItems = await chrome.history.search({
        text: site,
        startTime: startTime,
        endTime: endTime,
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

    // Reset timer state
    chrome.storage.sync.set({
      timerActive: false,
      triggerSite: '',
      lastCleaned: new Date().toISOString()
    });

    console.log(`Cleared ${totalCleared} history entries`);
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