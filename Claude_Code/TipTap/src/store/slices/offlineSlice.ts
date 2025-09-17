import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface OfflineAction {
  id: string;
  type: 'PAYMENT' | 'TRANSACTION_UPDATE' | 'SETTINGS_UPDATE';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineState {
  isOnline: boolean;
  queue: OfflineAction[];
  isProcessing: boolean;
}

const initialState: OfflineState = {
  isOnline: true,
  queue: [],
  isProcessing: false,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    addToQueue: (state, action: PayloadAction<Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>>) => {
      const queueItem: OfflineAction = {
        ...action.payload,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      state.queue.push(queueItem);
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
    },
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const item = state.queue.find(item => item.id === action.payload);
      if (item) {
        item.retryCount++;
      }
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    clearQueue: state => {
      state.queue = [];
    },
    removeFailedItems: state => {
      state.queue = state.queue.filter(item => item.retryCount < item.maxRetries);
    },
  },
});

export const {
  setOnlineStatus,
  addToQueue,
  removeFromQueue,
  incrementRetryCount,
  setProcessing,
  clearQueue,
  removeFailedItems,
} = offlineSlice.actions;

export default offlineSlice.reducer;