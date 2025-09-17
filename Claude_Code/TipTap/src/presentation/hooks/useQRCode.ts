import { useState, useEffect, useCallback } from 'react';
import { IQRCodeRepository, QRCodeData, QRScanResult, QRGenerateOptions } from '@/domain/repositories/IQRCodeRepository';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';

export interface QRCodeState {
  isScanning: boolean;
  hasPermission: boolean;
  lastScanResult: QRScanResult | null;
  generatedQRCode: string | null;
  error: string | null;
}

export interface UseQRCodeHook {
  state: QRCodeState;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  scanQRCode: () => Promise<QRScanResult>;
  generateQRCode: (data: QRCodeData, options?: QRGenerateOptions) => Promise<string>;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
  clearResults: () => void;
}

const initialState: QRCodeState = {
  isScanning: false,
  hasPermission: false,
  lastScanResult: null,
  generatedQRCode: null,
  error: null
};

export const useQRCode = (
  qrRepository: IQRCodeRepository,
  errorHandler: ErrorHandler
): UseQRCodeHook => {
  const [state, setState] = useState<QRCodeState>(initialState);

  // Initialize permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const hasPermission = await qrRepository.hasPermission();
        setState(prev => ({
          ...prev,
          hasPermission
        }));
      } catch (error) {
        const qrError = errorHandler.handleError(error, {
          operation: 'checkPermissions'
        });

        setState(prev => ({
          ...prev,
          error: qrError.getUserFriendlyMessage()
        }));
      }
    };

    checkPermissions();
  }, [qrRepository, errorHandler]);

  // Set up QR code event listeners
  useEffect(() => {
    const handleQRCodeScanned = (result: QRScanResult) => {
      setState(prev => ({
        ...prev,
        lastScanResult: result,
        error: result.success ? null : result.error || 'QR code scanning failed'
      }));
    };

    const handleScanningStateChange = (isScanning: boolean) => {
      setState(prev => ({
        ...prev,
        isScanning
      }));
    };

    qrRepository.onQRCodeScanned(handleQRCodeScanned);
    qrRepository.onScanningStateChange(handleScanningStateChange);

    // Cleanup is handled by the repository implementation
    return () => {
      // Any cleanup if needed
    };
  }, [qrRepository]);

  const startScanning = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!state.hasPermission) {
        const granted = await qrRepository.requestPermission();
        if (!granted) {
          setState(prev => ({
            ...prev,
            error: 'Camera permission is required for QR code scanning'
          }));
          return;
        }
        setState(prev => ({ ...prev, hasPermission: true }));
      }

      await qrRepository.startScanning();
    } catch (error) {
      const qrError = errorHandler.handleError(error, {
        operation: 'startScanning'
      });

      setState(prev => ({
        ...prev,
        error: qrError.getUserFriendlyMessage(),
        isScanning: false
      }));
    }
  }, [qrRepository, errorHandler, state.hasPermission]);

  const stopScanning = useCallback(async () => {
    try {
      await qrRepository.stopScanning();
    } catch (error) {
      const qrError = errorHandler.handleError(error, {
        operation: 'stopScanning'
      });

      setState(prev => ({
        ...prev,
        error: qrError.getUserFriendlyMessage()
      }));
    }
  }, [qrRepository, errorHandler]);

  const scanQRCode = useCallback(async (): Promise<QRScanResult> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const result = await qrRepository.scanQRCode();

      setState(prev => ({
        ...prev,
        lastScanResult: result,
        error: result.success ? null : result.error || 'QR code scanning failed'
      }));

      return result;
    } catch (error) {
      const qrError = errorHandler.handleError(error, {
        operation: 'scanQRCode'
      });

      const errorResult: QRScanResult = {
        success: false,
        error: qrError.getUserFriendlyMessage()
      };

      setState(prev => ({
        ...prev,
        lastScanResult: errorResult,
        error: qrError.getUserFriendlyMessage()
      }));

      return errorResult;
    }
  }, [qrRepository, errorHandler]);

  const generateQRCode = useCallback(async (
    data: QRCodeData,
    options?: QRGenerateOptions
  ): Promise<string> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const qrCode = await qrRepository.generateQRCode(data, options);

      setState(prev => ({
        ...prev,
        generatedQRCode: qrCode
      }));

      return qrCode;
    } catch (error) {
      const qrError = errorHandler.handleError(error, {
        operation: 'generateQRCode',
        dataType: data.type
      });

      setState(prev => ({
        ...prev,
        error: qrError.getUserFriendlyMessage()
      }));

      throw qrError;
    }
  }, [qrRepository, errorHandler]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const granted = await qrRepository.requestPermission();

      setState(prev => ({
        ...prev,
        hasPermission: granted
      }));

      return granted;
    } catch (error) {
      const qrError = errorHandler.handleError(error, {
        operation: 'requestPermission'
      });

      setState(prev => ({
        ...prev,
        error: qrError.getUserFriendlyMessage(),
        hasPermission: false
      }));

      return false;
    }
  }, [qrRepository, errorHandler]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastScanResult: null,
      generatedQRCode: null,
      error: null
    }));
  }, []);

  return {
    state,
    startScanning,
    stopScanning,
    scanQRCode,
    generateQRCode,
    requestPermission,
    clearError,
    clearResults
  };
};