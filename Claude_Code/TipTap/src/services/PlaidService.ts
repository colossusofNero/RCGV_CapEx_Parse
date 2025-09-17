import { PlaidLink, LinkSuccess, LinkExit, LinkEvent } from 'react-native-plaid-link-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

export interface PlaidConfig {
  clientId: string;
  environment: 'sandbox' | 'development' | 'production';
  clientName: string;
  products: string[];
  countryCodes: string[];
}

export interface BankAccount {
  accountId: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit card' | 'loan';
  accountSubtype: string;
  mask: string;
  institutionId: string;
  institutionName: string;
  isActive: boolean;
}

export interface BankBalance {
  accountId: string;
  available?: number;
  current?: number;
  limit?: number;
  isoCurrencyCode?: string;
  unofficialCurrencyCode?: string;
}

export interface LinkTokenRequest {
  userId: string;
  clientName: string;
  products: string[];
  countryCodes: string[];
  language: string;
}

export interface LinkTokenResponse {
  linkToken: string;
  expiration: string;
}

export interface ExchangeTokenRequest {
  publicToken: string;
  institutionId: string;
  institutionName: string;
}

export interface ExchangeTokenResponse {
  accessToken: string;
  itemId: string;
}

export interface ACHPaymentRequest {
  accountId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ACHPaymentResult {
  success: boolean;
  paymentId?: string;
  status?: 'pending' | 'completed' | 'failed';
  error?: string;
  errorCode?: string;
}

const STORAGE_KEYS = {
  PLAID_CONFIG: 'plaid_config',
  ACCESS_TOKENS: 'plaid_access_tokens',
  BANK_ACCOUNTS: 'plaid_bank_accounts',
  BANK_BALANCES: 'plaid_bank_balances',
};

export class PlaidService {
  private static instance: PlaidService;
  private config: PlaidConfig | null = null;
  private backendBaseUrl: string;

  private constructor() {
    this.backendBaseUrl = __DEV__
      ? 'http://localhost:3000/api'  // Development backend
      : 'https://your-api.com/api';  // Production backend
  }

  public static getInstance(): PlaidService {
    if (!PlaidService.instance) {
      PlaidService.instance = new PlaidService();
    }
    return PlaidService.instance;
  }

  async initialize(config: PlaidConfig): Promise<void> {
    this.config = config;
    await EncryptedStorage.setItem(STORAGE_KEYS.PLAID_CONFIG, JSON.stringify(config));
  }

  async getConfig(): Promise<PlaidConfig | null> {
    if (this.config) return this.config;

    try {
      const storedConfig = await EncryptedStorage.getItem(STORAGE_KEYS.PLAID_CONFIG);
      if (storedConfig) {
        this.config = JSON.parse(storedConfig);
        return this.config;
      }
    } catch (error) {
      console.error('Failed to retrieve Plaid config:', error);
    }
    return null;
  }

  // Create link token on backend
  async createLinkToken(request: LinkTokenRequest): Promise<LinkTokenResponse> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/plaid/link-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(`Failed to create link token: ${error.message}`);
    }
  }

  // Open Plaid Link for bank account connection
  async openPlaidLink(linkToken: string): Promise<LinkSuccess> {
    return new Promise((resolve, reject) => {
      const linkConfig = {
        token: linkToken,
        onSuccess: (success: LinkSuccess) => {
          console.log('Plaid Link success:', success);
          resolve(success);
        },
        onExit: (exit: LinkExit) => {
          console.log('Plaid Link exit:', exit);
          if (exit.error) {
            reject(new Error(exit.error.error_message || 'Link process failed'));
          } else {
            reject(new Error('Link process was cancelled'));
          }
        },
        onEvent: (event: LinkEvent) => {
          console.log('Plaid Link event:', event);
        },
      };

      PlaidLink.open(linkConfig);
    });
  }

  // Exchange public token for access token
  async exchangePublicToken(request: ExchangeTokenRequest): Promise<ExchangeTokenResponse> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/plaid/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store access token securely
      await this.storeAccessToken(data.itemId, data.accessToken);

      return data;
    } catch (error: any) {
      throw new Error(`Failed to exchange public token: ${error.message}`);
    }
  }

  // Get bank accounts for connected institution
  async getBankAccounts(itemId: string): Promise<BankAccount[]> {
    try {
      // First try to get from local storage
      const storedAccounts = await this.getStoredBankAccounts(itemId);
      if (storedAccounts.length > 0) {
        return storedAccounts;
      }

      // If not in storage, fetch from backend
      const response = await fetch(`${this.backendBaseUrl}/plaid/accounts/${itemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const accounts: BankAccount[] = data.accounts;

      // Store accounts locally
      await this.storeBankAccounts(itemId, accounts);

      return accounts;
    } catch (error: any) {
      throw new Error(`Failed to get bank accounts: ${error.message}`);
    }
  }

  // Get account balances
  async getAccountBalances(accountIds: string[]): Promise<BankBalance[]> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/plaid/balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const balances: BankBalance[] = data.balances;

      // Store balances with timestamp
      await this.storeAccountBalances(balances);

      return balances;
    } catch (error: any) {
      throw new Error(`Failed to get account balances: ${error.message}`);
    }
  }

  // Check if account has sufficient balance
  async checkSufficientBalance(accountId: string, amount: number): Promise<boolean> {
    try {
      const balances = await this.getAccountBalances([accountId]);
      const accountBalance = balances.find(b => b.accountId === accountId);

      if (!accountBalance) {
        throw new Error('Account balance not found');
      }

      const availableBalance = accountBalance.available || accountBalance.current || 0;
      return availableBalance >= amount;
    } catch (error: any) {
      console.error('Balance check failed:', error);
      return false;
    }
  }

  // Initiate ACH payment
  async initiateACHPayment(request: ACHPaymentRequest, idempotencyKey: string): Promise<ACHPaymentResult> {
    try {
      // Check balance before initiating payment
      const hasSufficientBalance = await this.checkSufficientBalance(request.accountId, request.amount);
      if (!hasSufficientBalance) {
        return {
          success: false,
          error: 'Insufficient funds in account',
          errorCode: 'INSUFFICIENT_FUNDS',
        };
      }

      const response = await fetch(`${this.backendBaseUrl}/plaid/ach-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        paymentId: data.paymentId,
        status: data.status || 'pending',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ACH payment failed',
        errorCode: 'PAYMENT_ERROR',
      };
    }
  }

  // Get ACH payment status
  async getACHPaymentStatus(paymentId: string): Promise<ACHPaymentResult> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/plaid/ach-payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        paymentId: data.paymentId,
        status: data.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get payment status',
        errorCode: 'STATUS_ERROR',
      };
    }
  }

  // Retry logic with exponential backoff
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Storage methods
  private async storeAccessToken(itemId: string, accessToken: string): Promise<void> {
    try {
      const existingTokens = await this.getStoredAccessTokens();
      existingTokens[itemId] = accessToken;

      await EncryptedStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKENS,
        JSON.stringify(existingTokens)
      );
    } catch (error) {
      console.error('Failed to store access token:', error);
      throw new Error('Failed to store access token');
    }
  }

  private async getStoredAccessTokens(): Promise<Record<string, string>> {
    try {
      const stored = await EncryptedStorage.getItem(STORAGE_KEYS.ACCESS_TOKENS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to retrieve access tokens:', error);
      return {};
    }
  }

  private async storeBankAccounts(itemId: string, accounts: BankAccount[]): Promise<void> {
    try {
      const existingAccounts = await this.getAllStoredBankAccounts();
      existingAccounts[itemId] = accounts;

      await AsyncStorage.setItem(
        STORAGE_KEYS.BANK_ACCOUNTS,
        JSON.stringify(existingAccounts)
      );
    } catch (error) {
      console.error('Failed to store bank accounts:', error);
    }
  }

  private async getStoredBankAccounts(itemId: string): Promise<BankAccount[]> {
    try {
      const allAccounts = await this.getAllStoredBankAccounts();
      return allAccounts[itemId] || [];
    } catch (error) {
      console.error('Failed to retrieve bank accounts:', error);
      return [];
    }
  }

  private async getAllStoredBankAccounts(): Promise<Record<string, BankAccount[]>> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to retrieve all bank accounts:', error);
      return {};
    }
  }

  private async storeAccountBalances(balances: BankBalance[]): Promise<void> {
    try {
      const balanceData = {
        balances,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.BANK_BALANCES,
        JSON.stringify(balanceData)
      );
    } catch (error) {
      console.error('Failed to store account balances:', error);
    }
  }

  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'INVALID_CREDENTIALS',
      'INVALID_MFA',
      'ITEM_LOGIN_REQUIRED',
      'ACCESS_NOT_GRANTED',
      'INSUFFICIENT_FUNDS',
      'ACCOUNT_LOCKED',
    ];

    return nonRetryableCodes.includes(error.code || error.errorCode);
  }

  // Cleanup methods
  async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        EncryptedStorage.removeItem(STORAGE_KEYS.PLAID_CONFIG),
        EncryptedStorage.removeItem(STORAGE_KEYS.ACCESS_TOKENS),
        AsyncStorage.removeItem(STORAGE_KEYS.BANK_ACCOUNTS),
        AsyncStorage.removeItem(STORAGE_KEYS.BANK_BALANCES),
      ]);
    } catch (error) {
      console.error('Failed to clear Plaid data:', error);
    }
  }

  // Remove a specific institution's data
  async removeInstitution(itemId: string): Promise<void> {
    try {
      // Remove access token
      const tokens = await this.getStoredAccessTokens();
      delete tokens[itemId];
      await EncryptedStorage.setItem(STORAGE_KEYS.ACCESS_TOKENS, JSON.stringify(tokens));

      // Remove bank accounts
      const accounts = await this.getAllStoredBankAccounts();
      delete accounts[itemId];
      await AsyncStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(accounts));

      // Call backend to remove item
      await fetch(`${this.backendBaseUrl}/plaid/remove-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });
    } catch (error) {
      console.error('Failed to remove institution:', error);
      throw new Error('Failed to remove institution');
    }
  }
}

export default PlaidService;