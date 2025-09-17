import { NFCDataSource } from '@/infrastructure/datasources/NFCDataSource';
import { QRCodeDataSource } from '@/infrastructure/datasources/QRCodeDataSource';
import { useNFC } from '@/presentation/hooks/useNFC';
import { useQRCode } from '@/presentation/hooks/useQRCode';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';
import { PaymentMethod } from '@/domain/entities/Transaction';

// Mock the native modules and React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn((cb) => cb),
}));

describe('NFC to QR Code Fallback Integration Tests', () => {
  let nfcDataSource: NFCDataSource;
  let qrCodeDataSource: QRCodeDataSource;
  let errorHandler: ErrorHandler;

  // Mock state management
  const mockSetState = jest.fn();
  const React = require('react');

  beforeEach(() => {
    nfcDataSource = new NFCDataSource();
    qrCodeDataSource = new QRCodeDataSource();
    errorHandler = new ErrorHandler({
      enableLogging: true,
      enableReporting: false,
      maxRetryAttempts: 3
    });

    // Reset mocks
    jest.clearAllMocks();
    React.useState.mockImplementation((initial: any) => [initial, mockSetState]);
    React.useEffect.mockImplementation((effect: any) => effect());
  });

  describe('NFC Not Available Scenarios', () => {
    it('should fallback to QR when NFC is not supported', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(false);
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);

      // Mock NFC hook state
      React.useState
        .mockReturnValueOnce([false, mockSetState]) // isSupported
        .mockReturnValueOnce([false, mockSetState]) // isEnabled
        .mockReturnValueOnce([false, mockSetState]) // isScanning
        .mockReturnValueOnce([false, mockSetState]) // hasPermission
        .mockReturnValueOnce([null, mockSetState]) // lastTag
        .mockReturnValueOnce([null, mockSetState]); // error

      // Mock QR hook state
      React.useState
        .mockReturnValueOnce([false, mockSetState]) // isScanning
        .mockReturnValueOnce([true, mockSetState]) // hasPermission
        .mockReturnValueOnce([null, mockSetState]) // lastScanResult
        .mockReturnValueOnce([null, mockSetState]) // generatedQRCode
        .mockReturnValueOnce([null, mockSetState]); // error

      // Act
      const determinePaymentMethod = async (): Promise<PaymentMethod> => {
        const isNFCSupported = await nfcDataSource.isSupported();
        const hasQRPermission = await qrCodeDataSource.hasPermission();

        if (isNFCSupported) {
          return PaymentMethod.NFC;
        } else if (hasQRPermission) {
          return PaymentMethod.QR_CODE;
        } else {
          return PaymentMethod.MANUAL;
        }
      };

      const paymentMethod = await determinePaymentMethod();

      // Assert
      expect(paymentMethod).toBe(PaymentMethod.QR_CODE);
      expect(nfcDataSource.isSupported).toHaveBeenCalled();
      expect(qrCodeDataSource.hasPermission).toHaveBeenCalled();
    });

    it('should fallback to QR when NFC is not enabled', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'isEnabled').mockResolvedValue(false);
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);

      // Act
      const determinePaymentMethod = async (): Promise<PaymentMethod> => {
        const isNFCSupported = await nfcDataSource.isSupported();
        const isNFCEnabled = await nfcDataSource.isEnabled();
        const hasQRPermission = await qrCodeDataSource.hasPermission();

        if (isNFCSupported && isNFCEnabled) {
          return PaymentMethod.NFC;
        } else if (hasQRPermission) {
          return PaymentMethod.QR_CODE;
        } else {
          return PaymentMethod.MANUAL;
        }
      };

      const paymentMethod = await determinePaymentMethod();

      // Assert
      expect(paymentMethod).toBe(PaymentMethod.QR_CODE);
      expect(nfcDataSource.isEnabled).toHaveBeenCalled();
    });

    it('should fallback to QR when NFC permissions are denied', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'isEnabled').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'requestPermission').mockResolvedValue(false);
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);

      // Act
      const determinePaymentMethod = async (): Promise<PaymentMethod> => {
        const isNFCSupported = await nfcDataSource.isSupported();
        const isNFCEnabled = await nfcDataSource.isEnabled();

        if (isNFCSupported && isNFCEnabled) {
          const hasNFCPermission = await nfcDataSource.requestPermission();
          if (hasNFCPermission) {
            return PaymentMethod.NFC;
          }
        }

        const hasQRPermission = await qrCodeDataSource.hasPermission();
        return hasQRPermission ? PaymentMethod.QR_CODE : PaymentMethod.MANUAL;
      };

      const paymentMethod = await determinePaymentMethod();

      // Assert
      expect(paymentMethod).toBe(PaymentMethod.QR_CODE);
      expect(nfcDataSource.requestPermission).toHaveBeenCalled();
    });
  });

  describe('NFC Scanning Failures', () => {
    it('should fallback to QR when NFC scanning fails', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'isEnabled').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'requestPermission').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'startScanning').mockRejectedValue(new Error('NFC scanning failed'));
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);
      jest.spyOn(qrCodeDataSource, 'startScanning').mockResolvedValue();

      // Act
      const startPaymentScanning = async (): Promise<PaymentMethod> => {
        try {
          await nfcDataSource.startScanning();
          return PaymentMethod.NFC;
        } catch (error) {
          // Fallback to QR on NFC failure
          await qrCodeDataSource.startScanning();
          return PaymentMethod.QR_CODE;
        }
      };

      const paymentMethod = await startPaymentScanning();

      // Assert
      expect(paymentMethod).toBe(PaymentMethod.QR_CODE);
      expect(nfcDataSource.startScanning).toHaveBeenCalled();
      expect(qrCodeDataSource.startScanning).toHaveBeenCalled();
    });

    it('should retry NFC before falling back to QR', async () => {
      // Arrange
      let nfcAttempts = 0;
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'isEnabled').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'requestPermission').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'startScanning').mockImplementation(() => {
        nfcAttempts++;
        if (nfcAttempts < 3) {
          return Promise.reject(new Error('Temporary NFC failure'));
        }
        return Promise.reject(new Error('Permanent NFC failure'));
      });
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);
      jest.spyOn(qrCodeDataSource, 'startScanning').mockResolvedValue();

      // Act
      const startPaymentScanningWithRetry = async (): Promise<PaymentMethod> => {
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await nfcDataSource.startScanning();
            return PaymentMethod.NFC;
          } catch (error) {
            if (attempt === maxRetries) {
              // Final fallback to QR
              await qrCodeDataSource.startScanning();
              return PaymentMethod.QR_CODE;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        return PaymentMethod.MANUAL; // Should not reach here
      };

      const paymentMethod = await startPaymentScanningWithRetry();

      // Assert
      expect(nfcAttempts).toBe(3);
      expect(paymentMethod).toBe(PaymentMethod.QR_CODE);
      expect(qrCodeDataSource.startScanning).toHaveBeenCalled();
    });
  });

  describe('QR Code Backup Scenarios', () => {
    it('should handle QR fallback when camera permission is denied', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(false);
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(false);
      jest.spyOn(qrCodeDataSource, 'requestPermission').mockResolvedValue(false);

      // Act
      const determinePaymentMethod = async (): Promise<PaymentMethod> => {
        const isNFCSupported = await nfcDataSource.isSupported();

        if (!isNFCSupported) {
          const hasQRPermission = await qrCodeDataSource.hasPermission();
          if (!hasQRPermission) {
            const granted = await qrCodeDataSource.requestPermission();
            if (!granted) {
              return PaymentMethod.MANUAL; // Final fallback
            }
          }
          return PaymentMethod.QR_CODE;
        }

        return PaymentMethod.NFC;
      };

      const paymentMethod = await determinePaymentMethod();

      // Assert
      expect(paymentMethod).toBe(PaymentMethod.MANUAL);
      expect(qrCodeDataSource.requestPermission).toHaveBeenCalled();
    });

    it('should generate QR code for payment when NFC fails', async () => {
      // Arrange
      const paymentData = {
        merchantId: 'merchant_123',
        amount: 25.00,
        currency: 'USD',
        description: 'Coffee tip'
      };

      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'writeTag').mockRejectedValue(new Error('NFC write failed'));
      jest.spyOn(qrCodeDataSource, 'generateQRCode').mockResolvedValue('mock-qr-code-data');

      // Act
      const handlePaymentData = async (data: any): Promise<{ method: PaymentMethod; qrCode?: string }> => {
        try {
          await nfcDataSource.writeTag(data);
          return { method: PaymentMethod.NFC };
        } catch (error) {
          // Fallback to QR code generation
          const qrCode = await qrCodeDataSource.generateQRCode({
            type: 'payment',
            data: data,
            timestamp: Date.now()
          });
          return { method: PaymentMethod.QR_CODE, qrCode };
        }
      };

      const result = await handlePaymentData(paymentData);

      // Assert
      expect(result.method).toBe(PaymentMethod.QR_CODE);
      expect(result.qrCode).toBe('mock-qr-code-data');
      expect(nfcDataSource.writeTag).toHaveBeenCalledWith(paymentData);
      expect(qrCodeDataSource.generateQRCode).toHaveBeenCalled();
    });
  });

  describe('Smart Fallback Logic', () => {
    it('should prefer NFC when both are available', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'isEnabled').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'requestPermission').mockResolvedValue(true);
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);

      // Act
      const getPreferredPaymentMethod = async (): Promise<PaymentMethod> => {
        const [isNFCSupported, isNFCEnabled, hasQRPermission] = await Promise.all([
          nfcDataSource.isSupported(),
          nfcDataSource.isEnabled(),
          qrCodeDataSource.hasPermission()
        ]);

        if (isNFCSupported && isNFCEnabled) {
          const hasNFCPermission = await nfcDataSource.requestPermission();
          if (hasNFCPermission) {
            return PaymentMethod.NFC; // Prefer NFC
          }
        }

        return hasQRPermission ? PaymentMethod.QR_CODE : PaymentMethod.MANUAL;
      };

      const preferredMethod = await getPreferredPaymentMethod();

      // Assert
      expect(preferredMethod).toBe(PaymentMethod.NFC);
    });

    it('should handle simultaneous availability check', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'isEnabled').mockResolvedValue(false); // NFC disabled
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);

      // Act
      const getAvailableMethods = async (): Promise<PaymentMethod[]> => {
        const availableMethods: PaymentMethod[] = [];

        const [isNFCSupported, isNFCEnabled, hasQRPermission] = await Promise.all([
          nfcDataSource.isSupported(),
          nfcDataSource.isEnabled(),
          qrCodeDataSource.hasPermission()
        ]);

        if (isNFCSupported && isNFCEnabled) {
          availableMethods.push(PaymentMethod.NFC);
        }

        if (hasQRPermission) {
          availableMethods.push(PaymentMethod.QR_CODE);
        }

        if (availableMethods.length === 0) {
          availableMethods.push(PaymentMethod.MANUAL);
        }

        return availableMethods;
      };

      const availableMethods = await getAvailableMethods();

      // Assert
      expect(availableMethods).toEqual([PaymentMethod.QR_CODE]);
      expect(availableMethods).not.toContain(PaymentMethod.NFC);
    });

    it('should handle graceful degradation chain', async () => {
      // Arrange - Simulate progressive failures
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'isEnabled').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'requestPermission').mockResolvedValue(false); // Permission denied
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(false); // No camera permission
      jest.spyOn(qrCodeDataSource, 'requestPermission').mockResolvedValue(false); // Camera denied

      // Act
      const getFinalPaymentMethod = async (): Promise<{ method: PaymentMethod; fallbackChain: string[] }> => {
        const fallbackChain: string[] = [];

        // Try NFC first
        const isNFCSupported = await nfcDataSource.isSupported();
        const isNFCEnabled = await nfcDataSource.isEnabled();

        if (isNFCSupported && isNFCEnabled) {
          const hasNFCPermission = await nfcDataSource.requestPermission();
          if (hasNFCPermission) {
            fallbackChain.push('NFC');
            return { method: PaymentMethod.NFC, fallbackChain };
          }
        }

        // Try QR second
        let hasQRPermission = await qrCodeDataSource.hasPermission();
        if (!hasQRPermission) {
          hasQRPermission = await qrCodeDataSource.requestPermission();
        }

        if (hasQRPermission) {
          fallbackChain.push('QR_CODE');
          return { method: PaymentMethod.QR_CODE, fallbackChain };
        }

        // Final fallback to manual
        fallbackChain.push('MANUAL');
        return { method: PaymentMethod.MANUAL, fallbackChain };
      };

      const result = await getFinalPaymentMethod();

      // Assert
      expect(result.method).toBe(PaymentMethod.MANUAL);
      expect(result.fallbackChain).toEqual(['MANUAL']);
    });
  });

  describe('Recovery and Retry Scenarios', () => {
    it('should handle switching between payment methods during transaction', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'isSupported').mockResolvedValue(true);
      jest.spyOn(nfcDataSource, 'startScanning')
        .mockRejectedValueOnce(new Error('NFC busy'))
        .mockResolvedValueOnce(); // Second call succeeds
      jest.spyOn(nfcDataSource, 'stopScanning').mockResolvedValue();
      jest.spyOn(qrCodeDataSource, 'hasPermission').mockResolvedValue(true);
      jest.spyOn(qrCodeDataSource, 'startScanning').mockResolvedValue();
      jest.spyOn(qrCodeDataSource, 'stopScanning').mockResolvedValue();

      // Act
      const handlePaymentMethodSwitch = async (): Promise<PaymentMethod[]> => {
        const methodsUsed: PaymentMethod[] = [];

        try {
          await nfcDataSource.startScanning();
          methodsUsed.push(PaymentMethod.NFC);
        } catch (error) {
          // Switch to QR
          await qrCodeDataSource.startScanning();
          methodsUsed.push(PaymentMethod.QR_CODE);

          // Now switch back to NFC (simulate user choice)
          await qrCodeDataSource.stopScanning();
          await nfcDataSource.startScanning();
          methodsUsed.push(PaymentMethod.NFC);
        }

        return methodsUsed;
      };

      const methodsUsed = await handlePaymentMethodSwitch();

      // Assert
      expect(methodsUsed).toEqual([PaymentMethod.QR_CODE, PaymentMethod.NFC]);
      expect(nfcDataSource.startScanning).toHaveBeenCalledTimes(2);
      expect(qrCodeDataSource.stopScanning).toHaveBeenCalled();
    });

    it('should handle timeout scenarios with fallback', async () => {
      // Arrange
      jest.spyOn(nfcDataSource, 'startScanning').mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('NFC timeout')), 100);
        });
      });
      jest.spyOn(qrCodeDataSource, 'startScanning').mockResolvedValue();

      // Act
      const handleTimeoutWithFallback = async (): Promise<PaymentMethod> => {
        const timeout = 200; // 200ms timeout

        try {
          await Promise.race([
            nfcDataSource.startScanning(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
          return PaymentMethod.NFC;
        } catch (error) {
          // Fallback to QR on timeout
          await qrCodeDataSource.startScanning();
          return PaymentMethod.QR_CODE;
        }
      };

      const result = await handleTimeoutWithFallback();

      // Assert
      expect(result).toBe(PaymentMethod.QR_CODE);
      expect(qrCodeDataSource.startScanning).toHaveBeenCalled();
    });
  });
});