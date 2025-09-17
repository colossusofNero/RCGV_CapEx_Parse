export interface PaymentMethod {
  id: string;
  type: 'nfc' | 'qr' | 'stripe_card' | 'ach_bank';
  name: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  method: 'nfc' | 'qr' | 'stripe_card' | 'ach_bank';
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  recipient?: string;
  notes?: string;
  merchantId?: string;
  riskScore?: number;
  securityFlags?: string[];
}

export interface TipSettings {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  currency: string;
  quickTipAmounts: number[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  kycComplete: boolean;
  termsAccepted: boolean;
  bankAccount?: BankAccount;
  settings: TipSettings;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  accountNumberMasked: string;
  balance?: number;
  isActive: boolean;
}

export interface OnboardingData {
  phone?: string;
  verificationCode?: string;
  bankAccount?: BankAccount;
  personalInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    ssn: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
}

export type RootStackParamList = {
  Home: undefined;
  Payment: {method: 'nfc' | 'qr' | 'stripe_card' | 'ach_bank'};
  Settings: undefined;
  History: undefined;
  TipAmount: {method: 'nfc' | 'qr' | 'stripe_card' | 'ach_bank'};
  Onboarding: undefined;
  Welcome: undefined;
  BankIntro: undefined;
  BankSelection: undefined;
  BankCredentials: {bankName: string; bankId: string};
  AccountSelection: {accounts: BankAccount[]};
  PhoneVerification: undefined;
  KYCCollection: undefined;
  NotificationPermission: undefined;
  OnboardingComplete: undefined;
  TransactionDetails: {transactionId: string};
};