import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {TipSettings} from '@/types';

interface SettingsState {
  tipSettings: TipSettings;
  theme: 'light' | 'dark';
  notifications: {
    transactions: boolean;
    dailyLimits: boolean;
    weeklyReports: boolean;
  };
  security: {
    biometricEnabled: boolean;
    pinEnabled: boolean;
    autoLock: number; // minutes
  };
}

const initialState: SettingsState = {
  tipSettings: {
    dailyLimit: 100,
    weeklyLimit: 500,
    monthlyLimit: 2000,
    currency: 'USD',
    quickTipAmounts: [5, 10, 15, 20],
  },
  theme: 'light',
  notifications: {
    transactions: true,
    dailyLimits: true,
    weeklyReports: false,
  },
  security: {
    biometricEnabled: false,
    pinEnabled: false,
    autoLock: 5,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateTipSettings: (state, action: PayloadAction<Partial<TipSettings>>) => {
      state.tipSettings = {...state.tipSettings, ...action.payload};
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => {
      state.notifications = {...state.notifications, ...action.payload};
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<SettingsState['security']>>) => {
      state.security = {...state.security, ...action.payload};
    },
    resetToDefaults: () => initialState,
  },
});

export const {
  updateTipSettings,
  setTheme,
  updateNotificationSettings,
  updateSecuritySettings,
  resetToDefaults,
} = settingsSlice.actions;

export default settingsSlice.reducer;