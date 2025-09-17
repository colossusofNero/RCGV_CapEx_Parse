import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from '@reduxjs/toolkit';

import userSlice from './slices/userSlice';
import transactionSlice from './slices/transactionSlice';
import settingsSlice from './slices/settingsSlice';
import cacheSlice from './slices/cacheSlice';
import offlineSlice from './slices/offlineSlice';
import {paymentApi} from './api/paymentApi';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'settings', 'transactions'],
};

const rootReducer = combineReducers({
  user: userSlice,
  transactions: transactionSlice,
  settings: settingsSlice,
  cache: cacheSlice,
  offline: offlineSlice,
  [paymentApi.reducerPath]: paymentApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(paymentApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;