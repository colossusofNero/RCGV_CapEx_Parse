import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import SecurityManager from '../security/SecurityManager';
import type { SessionState, SessionEventType } from '../security';

interface SecurityContextType {
  isSecurityInitialized: boolean;
  sessionState: SessionState | null;
  isSessionLocked: boolean;
  initializationError: string | null;
  authenticateForPayment: (transactionId: string, amount: number, merchantId?: string) => Promise<boolean>;
  unlockSession: () => Promise<boolean>;
  startSession: (userId: string) => Promise<string>;
  endSession: () => Promise<void>;
  updateLastActivity: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [isSecurityInitialized, setIsSecurityInitialized] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const handleSessionEvent = useCallback((eventType: SessionEventType, data?: any) => {
    console.log('Session event:', eventType, data);

    switch (eventType) {
      case 'session_started':
        setSessionState(SecurityManager.getSessionState());
        setIsSessionLocked(false);
        break;

      case 'session_ended':
        setSessionState(null);
        setIsSessionLocked(false);
        break;

      case 'session_locked':
        setIsSessionLocked(true);
        Alert.alert(
          'Session Locked',
          'Your session has been locked for security. Please authenticate to continue.',
          [{ text: 'OK' }]
        );
        break;

      case 'session_unlocked':
        setIsSessionLocked(false);
        setSessionState(SecurityManager.getSessionState());
        break;

      case 'auto_logout':
        setSessionState(null);
        setIsSessionLocked(false);

        const reason = data?.reason;
        let message = 'Your session has expired for security.';

        if (reason === 'session_timeout') {
          message = 'Your session has timed out. Please log in again.';
        }

        Alert.alert(
          'Session Expired',
          message,
          [{ text: 'OK' }]
        );
        break;

      case 'biometric_required':
        if (data?.fallbackToPIN) {
          Alert.alert(
            'Authentication Required',
            'Biometric authentication is not available. Please use your PIN.',
            [{ text: 'OK' }]
          );
        }
        break;

      default:
        console.log('Unhandled session event:', eventType);
    }
  }, []);

  const initializeSecurity = useCallback(async () => {
    try {
      console.log('Initializing security...');
      const result = await SecurityManager.initialize();

      if (!result.success) {
        throw new Error(`Security initialization failed: ${result.errors.join(', ')}`);
      }

      if (result.warnings.length > 0) {
        console.warn('Security initialization warnings:', result.warnings);
      }

      // Add session event listener
      await SecurityManager.addSessionEventListener(handleSessionEvent);

      setIsSecurityInitialized(true);
      setInitializationError(null);

      // Check if there's an existing session
      const currentSessionState = SecurityManager.getSessionState();
      setSessionState(currentSessionState);
      setIsSessionLocked(SecurityManager.isSessionLocked());

      console.log('Security initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown security initialization error';
      console.error('Security initialization failed:', errorMessage);
      setInitializationError(errorMessage);
      setIsSecurityInitialized(false);
    }
  }, [handleSessionEvent]);

  const authenticateForPayment = useCallback(async (
    transactionId: string,
    amount: number,
    merchantId?: string
  ): Promise<boolean> => {
    if (!isSecurityInitialized) {
      throw new Error('Security not initialized');
    }

    try {
      const securityCheck = await SecurityManager.authenticateForPayment(
        transactionId,
        amount,
        merchantId
      );

      if (!securityCheck.overallApproved) {
        let message = 'Payment authentication failed';

        if (!securityCheck.sessionValid) {
          message = 'Session expired. Please log in again.';
        } else if (!securityCheck.fraudRiskAcceptable && securityCheck.riskScore) {
          message = `Payment blocked due to security risk: ${securityCheck.riskScore.reasons.join(', ')}`;
        } else if (!securityCheck.biometricsPassed) {
          message = 'Authentication required for payment';
        }

        Alert.alert('Payment Blocked', message, [{ text: 'OK' }]);
        return false;
      }

      if (securityCheck.requiresAdditionalAuth && securityCheck.riskScore) {
        Alert.alert(
          'High Risk Transaction',
          'This transaction has been flagged for additional security review but will proceed.',
          [{ text: 'OK' }]
        );
      }

      return true;
    } catch (error) {
      console.error('Payment authentication error:', error);
      Alert.alert(
        'Authentication Error',
        error instanceof Error ? error.message : 'Authentication failed',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [isSecurityInitialized]);

  const unlockSession = useCallback(async (): Promise<boolean> => {
    if (!isSecurityInitialized) {
      return false;
    }

    try {
      const success = await SecurityManager.unlockSession();
      if (success) {
        setIsSessionLocked(false);
        setSessionState(SecurityManager.getSessionState());
      }
      return success;
    } catch (error) {
      console.error('Failed to unlock session:', error);
      return false;
    }
  }, [isSecurityInitialized]);

  const startSession = useCallback(async (userId: string): Promise<string> => {
    if (!isSecurityInitialized) {
      throw new Error('Security not initialized');
    }

    const sessionId = await SecurityManager.startSession(userId);
    setSessionState(SecurityManager.getSessionState());
    setIsSessionLocked(false);
    return sessionId;
  }, [isSecurityInitialized]);

  const endSession = useCallback(async (): Promise<void> => {
    if (!isSecurityInitialized) {
      return;
    }

    await SecurityManager.endSession();
    setSessionState(null);
    setIsSessionLocked(false);
  }, [isSecurityInitialized]);

  const updateLastActivity = useCallback((): void => {
    if (isSecurityInitialized && !isSessionLocked) {
      SecurityManager.updateLastActivity();
    }
  }, [isSecurityInitialized, isSessionLocked]);

  useEffect(() => {
    initializeSecurity();

    return () => {
      if (isSecurityInitialized) {
        SecurityManager.cleanup();
      }
    };
  }, [initializeSecurity, isSecurityInitialized]);

  const contextValue: SecurityContextType = {
    isSecurityInitialized,
    sessionState,
    isSessionLocked,
    initializationError,
    authenticateForPayment,
    unlockSession,
    startSession,
    endSession,
    updateLastActivity
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};