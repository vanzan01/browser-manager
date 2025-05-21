import { describe, it, expect, beforeEach, vi } from 'vitest';
import StorageAnalyzer from '../StorageAnalyzer';

// Simple mock for chrome APIs
const createMockChrome = () => ({
  history: {
    search: vi.fn().mockResolvedValue([
      { url: 'https://example.com/page1', title: 'Page1', lastVisitTime: Date.now() }
    ]),
    deleteUrl: vi.fn().mockResolvedValue(undefined)
  },
  cookies: {
    getAll: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined)
  },
  browsingData: {
    remove: vi.fn().mockResolvedValue(undefined)
  }
});

declare global {
  var chrome: any;
}

describe('StorageAnalyzer', () => {
  beforeEach(() => {
    global.chrome = createMockChrome();
  });

  it('groups history items by domain', async () => {
    const analyzer = new StorageAnalyzer();
    const result = await analyzer.getStorageByDomain();
    expect(result['example.com']).toBeDefined();
  });

  it('deleteSelective removes matching history', async () => {
    const analyzer = new StorageAnalyzer();
    await analyzer.deleteSelective({ domain: 'example.com', types: ['history'] });
    expect(global.chrome.history.deleteUrl).toHaveBeenCalled();
  });
});
