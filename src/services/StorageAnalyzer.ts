/// <reference types="chrome"/>

export interface StorageMetrics {
  history: number;  // bytes
  cache: number;    // bytes
  cookies: number;  // bytes
  localStorage: number; // bytes
  total: number;    // bytes
  items: number;    // count of entries
  lastAccessed: Date | null;
}

export interface DomainStorageMap {
  [domain: string]: {
    metrics: StorageMetrics;
    pages: {
      [url: string]: StorageMetrics;
    }
  }
}

export interface TimelineEntry {
  total: number;
  history: number;
  cache: number;
  cookies: number;
  localStorage: number;
}

export interface DeleteOptions {
  domain?: string;
  url?: string;
  types?: Array<'history' | 'cache' | 'cookies' | 'localStorage'>;
  since?: Date;
}

export interface CleanupRule {
  domain: string;
  localStorageKeys: string[];
  sessionStorageKeys: string[];
}

export const DEFAULT_CLEANUP_RULES: CleanupRule[] = [
  {
    domain: 'reddit.com',
    localStorageKeys: ['recent-subreddits-store'],
    sessionStorageKeys: ['recent-subreddits-store'],
  }
];

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default class StorageAnalyzer {
  private isExtension = typeof chrome !== 'undefined' &&
                       typeof chrome === 'object' &&
                       'browsingData' in chrome;

  async getStorageByDomain(): Promise<DomainStorageMap> {
    const result: DomainStorageMap = {};
    
    if (!this.isExtension) {
      return this.getMockData();
    }

    try {
      const historyItems = await this.getHistoryItems();

      for (const item of historyItems) {
        if (!item.url) continue;
        
        const domain = extractDomain(item.url);
        
        if (!result[domain]) {
          result[domain] = {
            metrics: this.createEmptyMetrics(),
            pages: {}
          };
        }
        
        const historySize = (item.title?.length || 0) + (item.url.length || 0);
        result[domain].metrics.history += historySize;
        result[domain].metrics.total += historySize;
        result[domain].metrics.items += 1;
        
        if (item.lastVisitTime) {
          const visitDate = new Date(item.lastVisitTime);
          if (!result[domain].metrics.lastAccessed || 
              visitDate > result[domain].metrics.lastAccessed) {
            result[domain].metrics.lastAccessed = visitDate;
          }
        }
        
        if (!result[domain].pages[item.url]) {
          result[domain].pages[item.url] = this.createEmptyMetrics();
        }
        
        result[domain].pages[item.url].history += historySize;
        result[domain].pages[item.url].total += historySize;
        result[domain].pages[item.url].items += 1;
        
        if (item.lastVisitTime) {
          const visitDate = new Date(item.lastVisitTime);
          if (!result[domain].pages[item.url].lastAccessed || visitDate > result[domain].pages[item.url].lastAccessed) {
            result[domain].pages[item.url].lastAccessed = visitDate;
          }
        }
      }
      
      const cookies = await this.getCookies();
      for (const cookie of cookies) {
        if (!cookie.domain) continue;
        
        let domain = cookie.domain;
        if (domain.startsWith('.')) {
          domain = domain.substring(1);
        }
        
        if (!result[domain]) {
          result[domain] = {
            metrics: this.createEmptyMetrics(),
            pages: {}
          };
        }
        
        const cookieSize = (cookie.name?.length || 0) + (cookie.value?.length || 0) + 50;
        result[domain].metrics.cookies += cookieSize;
        result[domain].metrics.total += cookieSize;
      }
    } catch (error) {
      console.error('Error analyzing storage:', error);
    }
    
    return result;
  }
  
  async getStorageTimeline(days: number): Promise<Record<string, TimelineEntry>> {
    const result: Record<string, TimelineEntry> = {};
    const now = new Date();

    const fixedSizes: TimelineEntry[] = [
      { total: 3500000, history: 700000, cache: 2000000, cookies: 300000, localStorage: 500000 },
      { total: 3200000, history: 650000, cache: 1800000, cookies: 280000, localStorage: 470000 },
      { total: 3000000, history: 600000, cache: 1700000, cookies: 250000, localStorage: 450000 },
      { total: 2800000, history: 550000, cache: 1600000, cookies: 230000, localStorage: 420000 },
      { total: 2600000, history: 520000, cache: 1500000, cookies: 210000, localStorage: 370000 },
      { total: 2400000, history: 480000, cache: 1400000, cookies: 200000, localStorage: 320000 },
      { total: 2200000, history: 440000, cache: 1300000, cookies: 180000, localStorage: 280000 },
      { total: 2000000, history: 400000, cache: 1200000, cookies: 160000, localStorage: 240000 },
      { total: 1800000, history: 360000, cache: 1100000, cookies: 140000, localStorage: 200000 },
      { total: 1600000, history: 320000, cache: 1000000, cookies: 120000, localStorage: 160000 },
      { total: 1400000, history: 280000, cache: 900000, cookies: 100000, localStorage: 120000 },
      { total: 1200000, history: 240000, cache: 800000, cookies: 80000, localStorage: 80000 },
      { total: 1000000, history: 200000, cache: 700000, cookies: 60000, localStorage: 40000 },
      { total: 900000, history: 180000, cache: 650000, cookies: 50000, localStorage: 20000 },
      { total: 800000, history: 160000, cache: 600000, cookies: 40000, localStorage: 0 },
    ];

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      result[dateString] = fixedSizes[i % fixedSizes.length];
    }

    return result;
  }
  
  async deleteSelective(options: DeleteOptions, cleanupRules: CleanupRule[] = []): Promise<number> {
    if (!this.isExtension) {
      console.log('Delete operation only available in extension mode');
      return 0;
    }
    
    try {
      let itemsDeleted = 0;
      
      if (!options.types || options.types.includes('history')) {
        const historyItems = await this.getHistoryItems();
        
        for (const item of historyItems) {
          if (!item.url) continue;
          
          const shouldDelete = this.shouldDeleteItem(item.url, options);
          
          if (shouldDelete) {
            await chrome.history.deleteUrl({ url: item.url });
            itemsDeleted++;
          }
        }
      }
      
      if (!options.types || options.types.includes('cookies')) {
        const cookies = await this.getCookies();
        
        for (const cookie of cookies) {
          if (!cookie.domain) continue;
          
          let domain = cookie.domain;
          if (domain.startsWith('.')) {
            domain = domain.substring(1);
          }
          
          const shouldDelete = options.domain ? 
            domain === options.domain || domain.endsWith(`.${options.domain}`) : 
            true;
          
          if (shouldDelete) {
            await chrome.cookies.remove({
              url: `http${cookie.secure ? 's' : ''}://${domain}${cookie.path}`,
              name: cookie.name,
            });
            itemsDeleted++;
          }
        }
      }
      
      if (!options.types || options.types.includes('cache')) {
        if (chrome.browsingData) {
          const since = options.since ? options.since.getTime() : 0;
          await chrome.browsingData.remove({ since }, { cache: true });
          itemsDeleted += 1;
        }
      }
      
      if (!options.types || options.types.includes('localStorage')) {
        for (const rule of cleanupRules) {
          const domainMatch = options.domain
            ? (options.domain === rule.domain || options.domain === `www.${rule.domain}` || options.domain.endsWith(`.${rule.domain}`))
            : true;

          if (!domainMatch) continue;

          try {
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
              if (tab.url && tab.url.includes(rule.domain) && tab.id) {
                try {
                  await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (lsKeys: string[], ssKeys: string[]) => {
                      lsKeys.forEach(key => localStorage.removeItem(key));
                      ssKeys.forEach(key => sessionStorage.removeItem(key));
                    },
                    args: [rule.localStorageKeys, rule.sessionStorageKeys]
                  });
                  itemsDeleted++;
                } catch {
                  console.warn('Could not clear localStorage for tab:', tab.url);
                }
              }
            }
          } catch (error) {
            console.error('Error clearing localStorage:', error);
          }
        }
      }
      
      return itemsDeleted;
    } catch (error) {
      console.error('Error deleting data:', error);
      return 0;
    }
  }
  
  private shouldDeleteItem(url: string, options: DeleteOptions): boolean {
    try {
      if (options.url && url !== options.url) {
        return false;
      }

      if (options.domain) {
        const itemDomain = extractDomain(url);
        if (itemDomain !== options.domain &&
            !itemDomain.endsWith(`.${options.domain}`)) {
          return false;
        }
      }

      // TODO: options.since filtering not yet implemented - requires visit time context
      return true;
    } catch {
      return false;
    }
  }
  
  private async getHistoryItems(): Promise<chrome.history.HistoryItem[]> {
    if (!this.isExtension) return [];
    
    try {
      return await chrome.history.search({
        text: '',
        startTime: 0,
        maxResults: 10000
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }
  
  private async getCookies(): Promise<chrome.cookies.Cookie[]> {
    if (!this.isExtension || !chrome.cookies) return [];

    try {
      return await chrome.cookies.getAll({});
    } catch (error) {
      console.error('Error fetching cookies:', error);
      return [];
    }
  }
  
  private createEmptyMetrics(): StorageMetrics {
    return {
      history: 0,
      cache: 0,
      cookies: 0,
      localStorage: 0,
      total: 0,
      items: 0,
      lastAccessed: null
    };
  }
  
  private getMockData(): DomainStorageMap {
    const mockDomains = [
      'google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com',
      'netflix.com', 'amazon.com', 'reddit.com', 'wikipedia.org', 'linkedin.com'
    ];

    const rand = (max: number): number => Math.floor(Math.random() * max);
    const randDate = (): Date => new Date(Date.now() - rand(7 * 24 * 60 * 60 * 1000));

    function randomMetrics(historyMax: number, cacheMax: number, cookiesMax: number, lsMax: number, itemsMax: number): StorageMetrics {
      const history = rand(historyMax);
      const cache = rand(cacheMax);
      const cookies = rand(cookiesMax);
      const ls = rand(lsMax);
      return {
        history,
        cache,
        cookies,
        localStorage: ls,
        total: history + cache + cookies + ls,
        items: rand(itemsMax),
        lastAccessed: randDate()
      };
    }

    const result: DomainStorageMap = {};

    for (const domain of mockDomains) {
      result[domain] = {
        metrics: randomMetrics(100000, 500000, 50000, 200000, 100),
        pages: {}
      };

      const pageCount = rand(5) + 1;
      for (let i = 0; i < pageCount; i++) {
        const url = `https://${domain}/page${i + 1}`;
        result[domain].pages[url] = randomMetrics(10000, 50000, 5000, 20000, 10);
      }
    }

    return result;
  }
} 