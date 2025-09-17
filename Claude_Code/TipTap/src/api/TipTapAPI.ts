import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import CryptoJS from 'crypto-js';
import { Transaction, User, BankAccount } from '../types';
import { APP_CONFIG, ERROR_MESSAGES } from '../shared/constants/AppConstants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface TipRequest {
  amount: number;
  currency: string;
  recipientId: string;
  paymentMethod: 'nfc' | 'qr' | 'stripe_card' | 'ach_bank';
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TipResponse {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  fees: number;
  estimatedArrival: string;
}

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  requiresAuth?: boolean;
  skipRetry?: boolean;
}

class TipTapAPIClient {
  private baseURL: string;
  private apiKey: string;
  private deviceId: string;
  private websocket: WebSocket | null = null;
  private retryCount = 0;
  private maxRetries = APP_CONFIG.api.retryAttempts;

  constructor() {
    this.baseURL = __DEV__ ? 'http://localhost:3000/api' : 'https://api.tiptap.com';
    this.apiKey = 'your-api-key-here';
    this.deviceId = '';
    this.initializeDeviceId();
  }

  private async initializeDeviceId(): Promise<void> {
    try {
      let deviceId = await AsyncStorage.getItem('@tiptap_device_id');
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem('@tiptap_device_id', deviceId);
      }
      this.deviceId = deviceId;
    } catch (error) {
      console.error('Failed to initialize device ID:', error);
      this.deviceId = this.generateDeviceId();
    }
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  // JWT Token Management
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await EncryptedStorage.setItem('@tiptap_auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store auth tokens:', error);
      throw new Error('Token storage failed');
    }
  }

  private async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const tokensJson = await EncryptedStorage.getItem('@tiptap_auth_tokens');
      return tokensJson ? JSON.parse(tokensJson) : null;
    } catch (error) {
      console.error('Failed to retrieve auth tokens:', error);
      return null;
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await EncryptedStorage.removeItem('@tiptap_auth_tokens');
    } catch (error) {
      console.error('Failed to clear auth tokens:', error);
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens?.refreshToken) {
        return false;
      }

      // Check if refresh token is also expired (refresh tokens typically last longer)
      if (this.isRefreshTokenExpired(tokens)) {
        console.warn('Refresh token expired, requiring re-authentication');
        await this.clearTokens();
        return false;
      }

      const response = await this.makeRequest('/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: tokens.refreshToken,
          deviceId: this.deviceId // Include device ID for additional security
        },
        requiresAuth: false,
        skipRetry: true,
      });

      if (response.success) {
        const newTokens: AuthTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken || tokens.refreshToken, // Some systems rotate refresh tokens
          expiresAt: Date.now() + (response.data.expiresIn * 1000),
        };

        await this.storeTokens(newTokens);
        console.log('Token refreshed successfully');
        return true;
      }

      console.error('Token refresh response not successful:', response);
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return false;
    }
  }

  private isRefreshTokenExpired(tokens: AuthTokens): boolean {
    // Assume refresh tokens last 30 days by default
    const REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const tokenAge = Date.now() - (tokens.expiresAt - (7 * 24 * 60 * 60 * 1000)); // Approximate issued time
    return tokenAge > REFRESH_TOKEN_LIFETIME;
  }

  async revokeAllTokens(): Promise<ApiResponse<void>> {
    try {
      const response = await this.makeRequest('/auth/revoke-all', {
        method: 'POST',
        requiresAuth: true,
      });

      await this.clearTokens();
      this.disconnectWebSocket();

      return response;
    } catch (error) {
      await this.clearTokens();
      throw error;
    }
  }

  async getTokenInfo(): Promise<ApiResponse<{
    expiresAt: number;
    issuedAt: number;
    scopes: string[];
    deviceId: string;
  }>> {
    return this.makeRequest<{
      expiresAt: number;
      issuedAt: number;
      scopes: string[];
      deviceId: string;
    }>('/auth/token-info', {
      method: 'GET',
      requiresAuth: true,
    });
  }

  private isTokenExpired(tokens: AuthTokens): boolean {
    return Date.now() >= tokens.expiresAt - (5 * 60 * 1000); // 5 minutes buffer
  }

  private async getValidAccessToken(): Promise<string | null> {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens) {
        return null;
      }

      if (this.isTokenExpired(tokens)) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          return null;
        }
        const newTokens = await this.getStoredTokens();
        return newTokens?.accessToken || null;
      }

      return tokens.accessToken;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  // API Request Signing with Enhanced Security
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateRequestSignature(
    method: string,
    path: string,
    body: string,
    timestamp: number,
    nonce: string,
    accessToken?: string
  ): string {
    // Create canonical request for signing
    const canonicalRequest = [
      method.toUpperCase(),
      path,
      timestamp.toString(),
      nonce,
      body,
      accessToken || ''
    ].join('\n');

    // Generate signature using HMAC-SHA256
    const signature = CryptoJS.HmacSHA256(canonicalRequest, this.apiKey).toString();
    return signature;
  }

  private validateTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return timeDiff <= maxAge;
  }

  private async makeSignedRequest(endpoint: string, options: RequestOptions): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const timestamp = Date.now();
    const nonce = this.generateNonce();
    const method = options.method;
    const bodyString = options.body ? JSON.stringify(options.body) : '';

    // Validate timestamp to prevent replay attacks
    if (!this.validateTimestamp(timestamp)) {
      throw new Error('Request timestamp is invalid');
    }

    let accessToken: string | undefined;
    if (options.requiresAuth !== false) {
      accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('Authentication required');
      }
    }

    const signature = this.generateRequestSignature(
      method,
      endpoint,
      bodyString,
      timestamp,
      nonce,
      accessToken
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Device-ID': this.deviceId,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
      'X-Signature': signature,
      'User-Agent': `TipTap/${APP_CONFIG.version} (${APP_CONFIG.bundleId})`,
      'X-Client-Version': APP_CONFIG.version,
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
      timeout: APP_CONFIG.api.timeout,
    };

    if (options.body && method !== 'GET') {
      config.body = bodyString;
    }

    return fetch(url, config);
  }

  // Rate Limiting Handling with Exponential Backoff
  private async handleRateLimit(response: Response, retryAttempt = 0): Promise<void> {
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
    const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
    const retryAfter = parseInt(response.headers.get('Retry-After') || '0');

    let delay: number;

    if (retryAfter > 0) {
      // Use server-provided retry delay
      delay = retryAfter * 1000;
    } else if (remaining === 0 && resetTime > 0) {
      // Rate limit exceeded, wait until reset time
      delay = Math.max(resetTime * 1000 - Date.now(), 1000);
    } else {
      // Exponential backoff for other rate limit scenarios
      delay = Math.min(1000 * Math.pow(2, retryAttempt), 30000); // Max 30 seconds
    }

    console.warn(`Rate limit encountered. Waiting ${delay}ms before retry... (attempt ${retryAttempt + 1})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async handleBackoff(retryAttempt: number): Promise<void> {
    const baseDelay = APP_CONFIG.api.retryDelay;
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const delay = Math.min(baseDelay * Math.pow(2, retryAttempt) + jitter, 30000);

    console.warn(`Backing off for ${delay}ms (attempt ${retryAttempt + 1})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async makeRequest<T = any>(endpoint: string, options: RequestOptions): Promise<ApiResponse<T>> {
    try {
      const response = await this.makeSignedRequest(endpoint, options);

      if (response.status === 429) {
        if (!options.skipRetry && this.retryCount < this.maxRetries) {
          await this.handleRateLimit(response, this.retryCount);
          this.retryCount++;
          return this.makeRequest(endpoint, options);
        }
      }

      const data = await response.json();
      this.retryCount = 0;

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (!options.skipRetry && this.retryCount < this.maxRetries && this.shouldRetry(error)) {
        await this.handleBackoff(this.retryCount);
        this.retryCount++;
        return this.makeRequest(endpoint, options);
      }

      this.retryCount = 0;
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (error.name === 'TypeError' && error.message.includes('network')) {
      return true;
    }
    if (error.message.includes('timeout')) {
      return true;
    }
    return false;
  }

  // Authentication Endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: credentials,
      requiresAuth: false,
    });

    if (response.success && response.data.tokens) {
      await this.storeTokens(response.data.tokens);
    }

    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: userData,
      requiresAuth: false,
    });

    if (response.success && response.data.tokens) {
      await this.storeTokens(response.data.tokens);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await this.makeRequest('/auth/logout', {
        method: 'POST',
        requiresAuth: true,
      });

      await this.clearTokens();
      this.disconnectWebSocket();

      return response;
    } catch (error) {
      await this.clearTokens();
      throw error;
    }
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: { email },
      requiresAuth: false,
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: { token },
      requiresAuth: false,
    });
  }

  async verifyPhone(phone: string, code: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/verify-phone', {
      method: 'POST',
      body: { phone, code },
      requiresAuth: false,
    });
  }

  async resendPhoneVerification(phone: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/resend-phone-verification', {
      method: 'POST',
      body: { phone },
      requiresAuth: false,
    });
  }

  async resendEmailVerification(): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/resend-email-verification', {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
      requiresAuth: true,
    });
  }

  async enableTwoFactor(): Promise<ApiResponse<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>> {
    return this.makeRequest<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>('/auth/2fa/enable', {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async verifyTwoFactor(token: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/2fa/verify', {
      method: 'POST',
      body: { token },
      requiresAuth: true,
    });
  }

  async disableTwoFactor(token: string): Promise<ApiResponse<void>> {
    return this.makeRequest('/auth/2fa/disable', {
      method: 'POST',
      body: { token },
      requiresAuth: true,
    });
  }

  async loginWithTwoFactor(credentials: LoginCredentials, twoFactorToken: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth/login/2fa', {
      method: 'POST',
      body: { ...credentials, twoFactorToken },
      requiresAuth: false,
    });

    if (response.success && response.data.tokens) {
      await this.storeTokens(response.data.tokens);
    }

    return response;
  }

  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest('/auth/delete-account', {
      method: 'DELETE',
      body: { password },
      requiresAuth: true,
    });

    if (response.success) {
      await this.clearTokens();
      this.disconnectWebSocket();
    }

    return response;
  }

  // Transaction Processing Endpoints
  async sendTip(tipRequest: TipRequest): Promise<ApiResponse<TipResponse>> {
    return this.makeRequest<TipResponse>('/transactions/tip/send', {
      method: 'POST',
      body: tipRequest,
      requiresAuth: true,
    });
  }

  async receiveTip(transactionId: string): Promise<ApiResponse<Transaction>> {
    return this.makeRequest<Transaction>(`/transactions/tip/receive/${transactionId}`, {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async validateTransaction(transactionId: string): Promise<ApiResponse<{ valid: boolean; transaction: Transaction }>> {
    return this.makeRequest<{ valid: boolean; transaction: Transaction }>(`/transactions/validate/${transactionId}`, {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async cancelTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return this.makeRequest<Transaction>(`/transactions/${transactionId}/cancel`, {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async refundTransaction(transactionId: string, reason?: string): Promise<ApiResponse<Transaction>> {
    return this.makeRequest<Transaction>(`/transactions/${transactionId}/refund`, {
      method: 'POST',
      body: { reason },
      requiresAuth: true,
    });
  }

  // Payment Method Specific Endpoints
  async processNFCPayment(nfcData: string, amount: number, currency: string): Promise<ApiResponse<TipResponse>> {
    return this.makeRequest<TipResponse>('/transactions/nfc/process', {
      method: 'POST',
      body: { nfcData, amount, currency },
      requiresAuth: true,
    });
  }

  async processQRPayment(qrData: string, amount: number, currency: string): Promise<ApiResponse<TipResponse>> {
    return this.makeRequest<TipResponse>('/transactions/qr/process', {
      method: 'POST',
      body: { qrData, amount, currency },
      requiresAuth: true,
    });
  }

  async processStripePayment(
    stripeToken: string,
    amount: number,
    currency: string,
    recipientId?: string
  ): Promise<ApiResponse<TipResponse>> {
    return this.makeRequest<TipResponse>('/transactions/stripe/process', {
      method: 'POST',
      body: { stripeToken, amount, currency, recipientId },
      requiresAuth: true,
    });
  }

  async processACHPayment(
    accountId: string,
    amount: number,
    currency: string,
    recipientId?: string
  ): Promise<ApiResponse<TipResponse>> {
    return this.makeRequest<TipResponse>('/transactions/ach/process', {
      method: 'POST',
      body: { accountId, amount, currency, recipientId },
      requiresAuth: true,
    });
  }

  async generateQRCode(amount: number, currency: string, metadata?: Record<string, any>): Promise<ApiResponse<{ qrCode: string; qrData: string; expiresAt: string }>> {
    return this.makeRequest<{ qrCode: string; qrData: string; expiresAt: string }>('/transactions/qr/generate', {
      method: 'POST',
      body: { amount, currency, metadata },
      requiresAuth: true,
    });
  }

  async generateNFCData(amount: number, currency: string, metadata?: Record<string, any>): Promise<ApiResponse<{ nfcData: string; expiresAt: string }>> {
    return this.makeRequest<{ nfcData: string; expiresAt: string }>('/transactions/nfc/generate', {
      method: 'POST',
      body: { amount, currency, metadata },
      requiresAuth: true,
    });
  }

  // Transaction History Sync
  async getTransactionHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string[];
  }): Promise<ApiResponse<{ transactions: Transaction[]; total: number; hasMore: boolean }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status.join(','));

    const endpoint = `/transactions/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<{ transactions: Transaction[]; total: number; hasMore: boolean }>(endpoint, {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async syncTransactionHistory(lastSyncTime?: number): Promise<ApiResponse<{
    transactions: Transaction[];
    deletedTransactionIds: string[];
    lastSyncTime: number;
    hasMore: boolean;
  }>> {
    return this.makeRequest<{
      transactions: Transaction[];
      deletedTransactionIds: string[];
      lastSyncTime: number;
      hasMore: boolean;
    }>('/transactions/sync', {
      method: 'POST',
      body: { lastSyncTime },
      requiresAuth: true,
    });
  }

  async batchSyncTransactions(batchSize = 100): Promise<ApiResponse<{
    synced: number;
    total: number;
    completed: boolean;
  }>> {
    return this.makeRequest<{
      synced: number;
      total: number;
      completed: boolean;
    }>('/transactions/batch-sync', {
      method: 'POST',
      body: { batchSize },
      requiresAuth: true,
    });
  }

  async getTransactionsByIds(transactionIds: string[]): Promise<ApiResponse<Transaction[]>> {
    return this.makeRequest<Transaction[]>('/transactions/batch', {
      method: 'POST',
      body: { transactionIds },
      requiresAuth: true,
    });
  }

  async searchTransactions(query: {
    searchTerm?: string;
    amount?: { min?: number; max?: number };
    dateRange?: { start: string; end: string };
    status?: string[];
    paymentMethods?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ transactions: Transaction[]; total: number; hasMore: boolean }>> {
    return this.makeRequest<{ transactions: Transaction[]; total: number; hasMore: boolean }>('/transactions/search', {
      method: 'POST',
      body: query,
      requiresAuth: true,
    });
  }

  async getTransactionDetails(transactionId: string): Promise<ApiResponse<Transaction>> {
    return this.makeRequest<Transaction>(`/transactions/${transactionId}`, {
      method: 'GET',
      requiresAuth: true,
    });
  }

  // Push Notification Registration
  async registerPushToken(tokenData: PushNotificationToken): Promise<ApiResponse<void>> {
    return this.makeRequest('/notifications/register-token', {
      method: 'POST',
      body: tokenData,
      requiresAuth: true,
    });
  }

  async unregisterPushToken(tokenData: PushNotificationToken): Promise<ApiResponse<void>> {
    return this.makeRequest('/notifications/unregister-token', {
      method: 'POST',
      body: tokenData,
      requiresAuth: true,
    });
  }

  async updateNotificationPreferences(preferences: {
    tipReceived: boolean;
    tipConfirmed: boolean;
    transactionUpdates: boolean;
    promotions: boolean;
    securityAlerts: boolean;
    balanceUpdates: boolean;
    marketingEmails: boolean;
  }): Promise<ApiResponse<void>> {
    return this.makeRequest('/notifications/preferences', {
      method: 'PUT',
      body: preferences,
      requiresAuth: true,
    });
  }

  async getNotificationPreferences(): Promise<ApiResponse<{
    tipReceived: boolean;
    tipConfirmed: boolean;
    transactionUpdates: boolean;
    promotions: boolean;
    securityAlerts: boolean;
    balanceUpdates: boolean;
    marketingEmails: boolean;
  }>> {
    return this.makeRequest<{
      tipReceived: boolean;
      tipConfirmed: boolean;
      transactionUpdates: boolean;
      promotions: boolean;
      securityAlerts: boolean;
      balanceUpdates: boolean;
      marketingEmails: boolean;
    }>('/notifications/preferences', {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async testPushNotification(type: 'tip_received' | 'transaction_update' | 'security_alert'): Promise<ApiResponse<void>> {
    return this.makeRequest('/notifications/test', {
      method: 'POST',
      body: { type },
      requiresAuth: true,
    });
  }

  async getNotificationHistory(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, any>;
      sentAt: string;
      read: boolean;
    }>;
    total: number;
    hasMore: boolean;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = `/notifications/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<{
      notifications: Array<{
        id: string;
        type: string;
        title: string;
        body: string;
        data?: Record<string, any>;
        sentAt: string;
        read: boolean;
      }>;
      total: number;
      hasMore: boolean;
    }>(endpoint, {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/notifications/${notificationId}/read`, {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return this.makeRequest('/notifications/mark-all-read', {
      method: 'POST',
      requiresAuth: true,
    });
  }

  // User Profile & Balance Management
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/user/profile', {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/user/profile', {
      method: 'PUT',
      body: userData,
      requiresAuth: true,
    });
  }

  async getUserBalance(): Promise<ApiResponse<{ balance: number; currency: string; pendingBalance: number }>> {
    return this.makeRequest<{ balance: number; currency: string; pendingBalance: number }>('/user/balance', {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async addBankAccount(bankData: Omit<BankAccount, 'id'>): Promise<ApiResponse<BankAccount>> {
    return this.makeRequest<BankAccount>('/user/bank-accounts', {
      method: 'POST',
      body: bankData,
      requiresAuth: true,
    });
  }

  async getBankAccounts(): Promise<ApiResponse<BankAccount[]>> {
    return this.makeRequest<BankAccount[]>('/user/bank-accounts', {
      method: 'GET',
      requiresAuth: true,
    });
  }

  // Balance Sync Across Devices
  async syncBalance(): Promise<ApiResponse<{
    balance: number;
    pendingBalance: number;
    currency: string;
    lastUpdated: string;
    syncTimestamp: number;
  }>> {
    return this.makeRequest<{
      balance: number;
      pendingBalance: number;
      currency: string;
      lastUpdated: string;
      syncTimestamp: number;
    }>('/user/balance/sync', {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async getBalanceSync(lastSyncTimestamp?: number): Promise<ApiResponse<{
    balance: number;
    pendingBalance: number;
    currency: string;
    transactions: Transaction[];
    lastUpdated: string;
    syncTimestamp: number;
    hasChanges: boolean;
  }>> {
    return this.makeRequest<{
      balance: number;
      pendingBalance: number;
      currency: string;
      transactions: Transaction[];
      lastUpdated: string;
      syncTimestamp: number;
      hasChanges: boolean;
    }>('/user/balance/sync', {
      method: 'GET',
      requiresAuth: true,
    });
  }

  async forceBalanceRefresh(): Promise<ApiResponse<{
    balance: number;
    pendingBalance: number;
    currency: string;
    lastUpdated: string;
  }>> {
    return this.makeRequest<{
      balance: number;
      pendingBalance: number;
      currency: string;
      lastUpdated: string;
    }>('/user/balance/refresh', {
      method: 'POST',
      requiresAuth: true,
    });
  }

  // Real-time WebSocket Connection with Enhanced Reliability
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 1000;
  private heartbeatInterval?: NodeJS.Timeout;

  connectWebSocket(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.getValidAccessToken().then(token => {
      if (!token) {
        console.error('Cannot connect WebSocket: No valid token');
        return;
      }

      const wsUrl = `${this.baseURL.replace('http', 'ws')}/ws?token=${encodeURIComponent(token)}&deviceId=${encodeURIComponent(this.deviceId)}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.startHeartbeat();
        this.onWebSocketConnected?.();
      };

      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.stopHeartbeat();
        this.onWebSocketDisconnected?.(event.code, event.reason);

        // Attempt to reconnect unless it was a normal closure or max attempts reached
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onWebSocketError?.(error);
      };
    }).catch(error => {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connectWebSocket();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now(),
          deviceId: this.deviceId
        }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }


  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'transaction_update':
        this.onTransactionUpdate?.(message.data);
        break;
      case 'balance_update':
        this.onBalanceUpdate?.(message.data);
        break;
      case 'tip_received':
        this.onTipReceived?.(message.data);
        break;
      case 'payment_notification':
        this.onPaymentNotification?.(message.data);
        break;
      case 'security_alert':
        this.onSecurityAlert?.(message.data);
        break;
      case 'system_message':
        this.onSystemMessage?.(message.data);
        break;
      case 'heartbeat_ack':
        // Heartbeat acknowledged - connection is alive
        break;
      case 'auth_required':
        console.warn('WebSocket requires re-authentication');
        this.disconnectWebSocket();
        this.connectWebSocket();
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type, message);
        this.onUnknownMessage?.(message);
    }
  }

  disconnectWebSocket(): void {
    this.stopHeartbeat();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection attempts

    if (this.websocket) {
      this.websocket.close(1000, 'User disconnected');
      this.websocket = null;
    }
  }

  // WebSocket Event Handlers (can be overridden)
  onWebSocketConnected?: () => void;
  onWebSocketDisconnected?: (code: number, reason: string) => void;
  onWebSocketError?: (error: Event) => void;
  onTransactionUpdate?: (transaction: Transaction) => void;
  onBalanceUpdate?: (balance: { balance: number; currency: string; pendingBalance: number }) => void;
  onTipReceived?: (tip: { amount: number; from: string; transactionId: string }) => void;
  onPaymentNotification?: (notification: { type: string; title: string; body: string; data?: any }) => void;
  onSecurityAlert?: (alert: { type: string; severity: 'low' | 'medium' | 'high'; message: string; action?: string }) => void;
  onSystemMessage?: (message: { type: string; title: string; content: string; priority: number }) => void;
  onUnknownMessage?: (message: any) => void;

  // Utility Methods
  async checkApiHealth(): Promise<ApiResponse<{ status: string; version: string; timestamp: number }>> {
    return this.makeRequest<{ status: string; version: string; timestamp: number }>('/health', {
      method: 'GET',
      requiresAuth: false,
      skipRetry: true,
    });
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.getUserProfile();
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  isAuthenticated(): Promise<boolean> {
    return this.getValidAccessToken().then(token => !!token);
  }
}

// Export singleton instance
export const TipTapAPI = new TipTapAPIClient();
export default TipTapAPI;