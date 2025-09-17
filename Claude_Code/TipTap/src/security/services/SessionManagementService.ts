import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorageService from './SecureStorageService';
import BiometricAuthService from './BiometricAuthService';

export interface SessionConfig {
  sessionTimeoutMs: number;
  autoLockTimeoutMs: number;
  maxInactiveSessions: number;
  requireBiometricForPayments: boolean;
  requireBiometricAfterBackground: boolean;
}

export interface SessionState {
  isActive: boolean;
  isLocked: boolean;
  lastActivityTime: number;
  sessionStartTime: number;
  backgroundTime?: number;
  userId?: string;
  sessionId: string;
}

export type SessionEventType = 'session_started' | 'session_ended' | 'session_locked' | 'session_unlocked' | 'auto_logout' | 'biometric_required';

export type SessionEventListener = (eventType: SessionEventType, data?: any) => void;

class SessionManagementService {
  private sessionState: SessionState | null = null;
  private sessionConfig: SessionConfig;
  private eventListeners: SessionEventListener[] = [];
  private sessionTimeoutTimer: NodeJS.Timeout | null = null;
  private autoLockTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;

  private readonly STORAGE_KEYS = {
    SESSION_STATE: 'session_state',
    SESSION_CONFIG: 'session_config',
    PIN_HASH: 'pin_hash'
  };

  constructor() {
    this.sessionConfig = {
      sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
      autoLockTimeoutMs: 5 * 60 * 1000,  // 5 minutes
      maxInactiveSessions: 3,
      requireBiometricForPayments: true,
      requireBiometricAfterBackground: true
    };

    this.initializeAppStateListener();
  }

  async initialize(): Promise<void> {
    await this.loadSessionConfig();
    await this.restoreSession();
  }

  async startSession(userId: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    this.sessionState = {
      isActive: true,
      isLocked: false,
      lastActivityTime: now,
      sessionStartTime: now,
      userId,
      sessionId
    };

    await this.persistSessionState();
    this.startSessionTimers();
    this.notifyListeners('session_started', { sessionId, userId });

    return sessionId;
  }

  async endSession(): Promise<void> {
    if (this.sessionState) {
      const sessionId = this.sessionState.sessionId;
      this.sessionState = null;
      await this.clearSessionState();
      this.clearTimers();
      this.notifyListeners('session_ended', { sessionId });
    }
  }

  async lockSession(): Promise<void> {
    if (this.sessionState && !this.sessionState.isLocked) {
      this.sessionState.isLocked = true;
      await this.persistSessionState();
      this.clearTimers();
      this.notifyListeners('session_locked');
    }
  }

  async unlockSession(): Promise<boolean> {
    if (!this.sessionState || !this.sessionState.isLocked) {
      return false;
    }

    try {
      const biometricAvailable = await BiometricAuthService.checkBiometricAvailability();

      if (biometricAvailable.isAvailable && this.sessionConfig.requireBiometricAfterBackground) {
        const authResult = await BiometricAuthService.authenticateWithBiometrics({
          promptMessage: 'Authenticate to unlock TipTap',
          cancelButtonText: 'Cancel',
          fallbackPromptMessage: 'Use PIN'
        });

        if (!authResult.success) {
          return false;
        }
      }

      this.sessionState.isLocked = false;
      this.sessionState.lastActivityTime = Date.now();

      if (this.sessionState.backgroundTime) {
        delete this.sessionState.backgroundTime;
      }

      await this.persistSessionState();
      this.startSessionTimers();
      this.notifyListeners('session_unlocked');

      return true;
    } catch (error) {
      console.error('Failed to unlock session:', error);
      return false;
    }
  }

  async requireBiometricForPayment(): Promise<boolean> {
    if (!this.sessionConfig.requireBiometricForPayments) {
      return true;
    }

    try {
      const availability = await BiometricAuthService.checkBiometricAvailability();

      if (!availability.isAvailable) {
        return await this.requirePinForPayment();
      }

      const authResult = await BiometricAuthService.authenticateWithBiometrics({
        promptMessage: 'Authenticate to authorize payment',
        cancelButtonText: 'Cancel',
        fallbackPromptMessage: 'Use PIN'
      });

      if (authResult.success) {
        this.updateLastActivity();
        return true;
      }

      if (authResult.error === 'UserFallback') {
        return await this.requirePinForPayment();
      }

      return false;
    } catch (error) {
      console.error('Biometric payment authentication failed:', error);
      return false;
    }
  }

  async requirePinForPayment(): Promise<boolean> {
    this.notifyListeners('biometric_required', { fallbackToPIN: true });
    return false;
  }

  updateLastActivity(): void {
    if (this.sessionState && this.sessionState.isActive && !this.sessionState.isLocked) {
      this.sessionState.lastActivityTime = Date.now();
      this.persistSessionState();
      this.resetSessionTimers();
    }
  }

  getSessionState(): SessionState | null {
    return this.sessionState;
  }

  isSessionActive(): boolean {
    return this.sessionState?.isActive && !this.sessionState?.isLocked || false;
  }

  isSessionLocked(): boolean {
    return this.sessionState?.isLocked || false;
  }

  addEventListener(listener: SessionEventListener): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: SessionEventListener): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  async updateSessionConfig(newConfig: Partial<SessionConfig>): Promise<void> {
    this.sessionConfig = { ...this.sessionConfig, ...newConfig };
    await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_CONFIG, JSON.stringify(this.sessionConfig));

    if (this.sessionState && this.sessionState.isActive) {
      this.resetSessionTimers();
    }
  }

  private async loadSessionConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION_CONFIG);
      if (configStr) {
        const savedConfig = JSON.parse(configStr);
        this.sessionConfig = { ...this.sessionConfig, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load session config:', error);
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      const sessionStr = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION_STATE);
      if (sessionStr) {
        const savedState: SessionState = JSON.parse(sessionStr);
        const now = Date.now();

        const timeSinceLastActivity = now - savedState.lastActivityTime;
        const sessionAge = now - savedState.sessionStartTime;

        if (sessionAge > this.sessionConfig.sessionTimeoutMs) {
          await this.clearSessionState();
          this.notifyListeners('auto_logout', { reason: 'session_timeout' });
          return;
        }

        if (timeSinceLastActivity > this.sessionConfig.autoLockTimeoutMs) {
          savedState.isLocked = true;
        }

        this.sessionState = savedState;

        if (this.sessionState.isActive && !this.sessionState.isLocked) {
          this.startSessionTimers();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  private async persistSessionState(): Promise<void> {
    if (this.sessionState) {
      try {
        await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_STATE, JSON.stringify(this.sessionState));
      } catch (error) {
        console.error('Failed to persist session state:', error);
      }
    }
  }

  private async clearSessionState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.SESSION_STATE);
    } catch (error) {
      console.error('Failed to clear session state:', error);
    }
  }

  private startSessionTimers(): void {
    this.clearTimers();

    this.autoLockTimer = setTimeout(() => {
      this.lockSession();
    }, this.sessionConfig.autoLockTimeoutMs);

    this.sessionTimeoutTimer = setTimeout(() => {
      this.endSession();
      this.notifyListeners('auto_logout', { reason: 'session_timeout' });
    }, this.sessionConfig.sessionTimeoutMs);
  }

  private resetSessionTimers(): void {
    this.clearTimers();
    this.startSessionTimers();
  }

  private clearTimers(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }

    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
      this.sessionTimeoutTimer = null;
    }
  }

  private initializeAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (!this.sessionState || !this.sessionState.isActive) {
      return;
    }

    if (nextAppState === 'background') {
      this.sessionState.backgroundTime = Date.now();
      this.persistSessionState();

      if (this.sessionConfig.requireBiometricAfterBackground) {
        this.lockSession();
      }
    } else if (nextAppState === 'active') {
      if (this.sessionState.backgroundTime) {
        const backgroundDuration = Date.now() - this.sessionState.backgroundTime;

        if (backgroundDuration > this.sessionConfig.autoLockTimeoutMs && !this.sessionState.isLocked) {
          this.lockSession();
        }
      }
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(eventType: SessionEventType, data?: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(eventType, data);
      } catch (error) {
        console.error('Error in session event listener:', error);
      }
    });
  }

  async cleanup(): Promise<void> {
    this.clearTimers();

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.eventListeners = [];
    await this.endSession();
  }
}

export default new SessionManagementService();