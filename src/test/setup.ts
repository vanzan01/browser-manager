// Global test setup
import { vi } from 'vitest';

// Mock the chrome API globally for all tests
global.chrome = {
  history: {
    search: vi.fn(),
    deleteUrl: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  cookies: {
    getAll: vi.fn(),
    remove: vi.fn(),
  },
  browsingData: {
    remove: vi.fn(),
  },
  tabs: {
    onUpdated: {
      addListener: vi.fn(),
    },
    onActivated: {
      addListener: vi.fn(),
    },
    get: vi.fn(),
  },
};