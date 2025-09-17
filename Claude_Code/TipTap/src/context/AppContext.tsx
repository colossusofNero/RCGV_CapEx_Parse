import React, {createContext, useContext, useReducer, ReactNode} from 'react';
import {Transaction, TipSettings, User} from '@/types';

interface AppState {
  user: User | null;
  transactions: Transaction[];
  settings: TipSettings;
  isLoading: boolean;
}

type AppAction =
  | {type: 'SET_USER'; payload: User}
  | {type: 'ADD_TRANSACTION'; payload: Transaction}
  | {type: 'UPDATE_SETTINGS'; payload: Partial<TipSettings>}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_TRANSACTIONS'; payload: Transaction[]};

const initialState: AppState = {
  user: null,
  transactions: [],
  settings: {
    dailyLimit: 100,
    weeklyLimit: 500,
    monthlyLimit: 2000,
    currency: 'USD',
    quickTipAmounts: [5, 10, 15, 20],
  },
  isLoading: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return {...state, user: action.payload};
    case 'ADD_TRANSACTION':
      return {...state, transactions: [action.payload, ...state.transactions]};
    case 'UPDATE_SETTINGS':
      return {...state, settings: {...state.settings, ...action.payload}};
    case 'SET_LOADING':
      return {...state, isLoading: action.payload};
    case 'SET_TRANSACTIONS':
      return {...state, transactions: action.payload};
    default:
      return state;
  }
};

export const AppProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{state, dispatch}}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};