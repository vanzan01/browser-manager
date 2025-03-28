/// <reference types="vite/client" />

interface Chrome {
  history: {
    search(params: {
      text: string;
      startTime?: number;
      endTime?: number;
      maxResults?: number;
    }): Promise<Array<{
      id: string;
      url?: string;
      title?: string;
      lastVisitTime?: number;
      visitCount?: number;
      typedCount?: number;
    }>>;
    deleteUrl(params: { url: string }): Promise<void>;
  };
  storage: {
    sync: {
      get(keys: string[]): Promise<any>;
      set(items: object): Promise<void>;
    };
  };
}

declare const chrome: Chrome;