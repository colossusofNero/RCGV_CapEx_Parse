import { useState, useEffect, useCallback } from 'react';
import { INFCRepository, NFCTag, NFCReadResult, NFCWriteResult } from '@/domain/repositories/INFCRepository';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';

export interface NFCState {
  isSupported: boolean;
  isEnabled: boolean;
  isScanning: boolean;
  hasPermission: boolean;
  lastTag: NFCTag | null;
  error: string | null;
}

export interface UseNFCHook {
  state: NFCState;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  readTag: () => Promise<NFCReadResult>;
  writeTag: (data: Record<string, any>) => Promise<NFCWriteResult>;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
}

const initialState: NFCState = {
  isSupported: false,
  isEnabled: false,
  isScanning: false,
  hasPermission: false,
  lastTag: null,
  error: null
};

export const useNFC = (
  nfcRepository: INFCRepository,
  errorHandler: ErrorHandler
): UseNFCHook => {
  const [state, setState] = useState<NFCState>(initialState);

  // Initialize NFC capabilities on mount
  useEffect(() => {
    const initializeNFC = async () => {
      try {
        const [isSupported, isEnabled] = await Promise.all([
          nfcRepository.isSupported(),
          nfcRepository.isEnabled()
        ]);

        setState(prev => ({
          ...prev,
          isSupported,
          isEnabled
        }));
      } catch (error) {
        const nfcError = errorHandler.handleError(error, {
          operation: 'initializeNFC'
        });

        setState(prev => ({
          ...prev,
          error: nfcError.getUserFriendlyMessage()
        }));
      }
    };

    initializeNFC();
  }, [nfcRepository, errorHandler]);

  // Set up NFC event listeners
  useEffect(() => {
    const handleTagDiscovered = (tag: NFCTag) => {
      setState(prev => ({
        ...prev,
        lastTag: tag,
        error: null
      }));
    };

    const handleScanningStateChange = (isScanning: boolean) => {
      setState(prev => ({
        ...prev,
        isScanning
      }));
    };

    nfcRepository.onTagDiscovered(handleTagDiscovered);
    nfcRepository.onScanningStateChange(handleScanningStateChange);

    // Cleanup is handled by the repository implementation
    return () => {
      // Any cleanup if needed
    };
  }, [nfcRepository]);

  const startScanning = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      await nfcRepository.startScanning();
    } catch (error) {
      const nfcError = errorHandler.handleError(error, {
        operation: 'startScanning'
      });

      setState(prev => ({
        ...prev,
        error: nfcError.getUserFriendlyMessage(),
        isScanning: false
      }));
    }
  }, [nfcRepository, errorHandler]);

  const stopScanning = useCallback(async () => {
    try {
      await nfcRepository.stopScanning();
    } catch (error) {
      const nfcError = errorHandler.handleError(error, {
        operation: 'stopScanning'
      });

      setState(prev => ({
        ...prev,
        error: nfcError.getUserFriendlyMessage()
      }));
    }
  }, [nfcRepository, errorHandler]);

  const readTag = useCallback(async (): Promise<NFCReadResult> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const result = await nfcRepository.readTag();

      if (result.success && result.tag) {
        setState(prev => ({
          ...prev,
          lastTag: result.tag!
        }));
      } else if (result.error) {
        setState(prev => ({
          ...prev,
          error: result.error!
        }));
      }

      return result;
    } catch (error) {
      const nfcError = errorHandler.handleError(error, {
        operation: 'readTag'
      });

      setState(prev => ({
        ...prev,
        error: nfcError.getUserFriendlyMessage()
      }));

      return {
        success: false,
        error: nfcError.getMessage()
      };
    }
  }, [nfcRepository, errorHandler]);

  const writeTag = useCallback(async (data: Record<string, any>): Promise<NFCWriteResult> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const result = await nfcRepository.writeTag(data);

      if (!result.success && result.error) {
        setState(prev => ({
          ...prev,
          error: result.error!
        }));
      }

      return result;
    } catch (error) {
      const nfcError = errorHandler.handleError(error, {
        operation: 'writeTag'
      });

      setState(prev => ({
        ...prev,
        error: nfcError.getUserFriendlyMessage()
      }));

      return {
        success: false,
        error: nfcError.getMessage()
      };
    }
  }, [nfcRepository, errorHandler]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const granted = await nfcRepository.requestPermission();

      setState(prev => ({
        ...prev,
        hasPermission: granted
      }));

      return granted;
    } catch (error) {
      const nfcError = errorHandler.handleError(error, {
        operation: 'requestPermission'
      });

      setState(prev => ({
        ...prev,
        error: nfcError.getUserFriendlyMessage(),
        hasPermission: false
      }));

      return false;
    }
  }, [nfcRepository, errorHandler]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    startScanning,
    stopScanning,
    readTag,
    writeTag,
    requestPermission,
    clearError
  };
};