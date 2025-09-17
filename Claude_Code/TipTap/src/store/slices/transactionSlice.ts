import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit';
import {Transaction} from '@/types';
import {RootState} from '../index';

interface TransactionState {
  items: Transaction[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filter: {
    dateRange?: {start: string; end: string};
    status?: Transaction['status'];
    minAmount?: number;
    maxAmount?: number;
  };
}

const initialState: TransactionState = {
  items: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  filter: {},
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload);
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.items = action.payload;
    },
    appendTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.items.push(...action.payload);
    },
    updateTransaction: (state, action: PayloadAction<{id: string; updates: Partial<Transaction>}>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {...state.items[index], ...action.payload.updates};
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: state => {
      state.error = null;
    },
    setFilter: (state, action: PayloadAction<TransactionState['filter']>) => {
      state.filter = action.payload;
      state.currentPage = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPagination: (state, action: PayloadAction<{totalPages: number; currentPage: number}>) => {
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
    },
  },
});

export const {
  addTransaction,
  setTransactions,
  appendTransactions,
  updateTransaction,
  setLoading,
  setError,
  clearError,
  setFilter,
  setPage,
  setPagination,
} = transactionSlice.actions;

export const selectTransactions = (state: RootState) => state.transactions.items;
export const selectTransactionsByStatus = createSelector(
  [selectTransactions, (_: RootState, status: Transaction['status']) => status],
  (transactions, status) => transactions.filter(t => t.status === status),
);
export const selectTransactionTotal = createSelector(
  [selectTransactions],
  transactions => transactions.reduce((total, t) => total + t.amount, 0),
);

export default transactionSlice.reducer;