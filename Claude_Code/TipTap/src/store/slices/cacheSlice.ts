import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface CacheState {
  entries: Record<string, CacheEntry>;
  defaultTTL: number; // Time to live in milliseconds
}

const initialState: CacheState = {
  entries: {},
  defaultTTL: 5 * 60 * 1000, // 5 minutes
};

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    setCacheEntry: (state, action: PayloadAction<{key: string; data: any; ttl?: number}>) => {
      const {key, data, ttl = state.defaultTTL} = action.payload;
      const now = Date.now();
      state.entries[key] = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      };
    },
    removeCacheEntry: (state, action: PayloadAction<string>) => {
      delete state.entries[action.payload];
    },
    clearExpiredEntries: state => {
      const now = Date.now();
      Object.keys(state.entries).forEach(key => {
        if (state.entries[key].expiresAt < now) {
          delete state.entries[key];
        }
      });
    },
    clearAllCache: state => {
      state.entries = {};
    },
    setDefaultTTL: (state, action: PayloadAction<number>) => {
      state.defaultTTL = action.payload;
    },
  },
});

export const {
  setCacheEntry,
  removeCacheEntry,
  clearExpiredEntries,
  clearAllCache,
  setDefaultTTL,
} = cacheSlice.actions;

export const selectCacheEntry = (state: {cache: CacheState}, key: string): any => {
  const entry = state.cache.entries[key];
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    return null; // Expired
  }

  return entry.data;
};

export default cacheSlice.reducer;