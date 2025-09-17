import { RNCamera } from 'react-native-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { IQRCodeRepository, QRCodeData, QRScanResult, QRGenerateOptions } from '@/domain/repositories/IQRCodeRepository';

export class QRCodeDataSource implements IQRCodeRepository {
  private isScanning: boolean = false;
  private qrScanCallback?: (result: QRScanResult) => void;
  private scanningStateCallback?: (isScanning: boolean) => void;

  async startScanning(): Promise<void> {
    if (this.isScanning) {
      return;
    }

    const hasPermission = await this.hasPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Camera permission required for QR code scanning');
      }
    }

    this.isScanning = true;
    this.scanningStateCallback?.(true);
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
    this.scanningStateCallback?.(false);
  }

  async scanQRCode(): Promise<QRScanResult> {
    try {
      if (!this.isScanning) {
        await this.startScanning();
      }

      // This would typically be handled by the camera component in the UI layer
      // For now, return a mock implementation
      return await new Promise((resolve) => {
        // Simulate QR code scanning delay
        setTimeout(() => {
          resolve({
            success: true,
            data: {
              type: 'payment',
              data: { merchantId: 'mock_merchant_123' },
              timestamp: Date.now()
            },
            rawData: 'mock_qr_data'
          });
        }, 2000);
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to scan QR code'
      };
    }
  }

  async generateQRCode(data: QRCodeData, options: QRGenerateOptions = {}): Promise<string> {
    try {
      // In a real implementation, you would use a QR code generation library
      // like react-native-qrcode-svg or similar
      const qrData = JSON.stringify(data);

      // Mock QR code generation - return base64 encoded SVG or image
      const mockQRCode = await this.mockGenerateQR(qrData, options);
      return mockQRCode;
    } catch (error: any) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  async hasPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      return false;
    }
  }

  onQRCodeScanned(callback: (result: QRScanResult) => void): void {
    this.qrScanCallback = callback;
  }

  onScanningStateChange(callback: (isScanning: boolean) => void): void {
    this.scanningStateCallback = callback;
  }

  // Mock method for demonstration - replace with actual QR generation library
  private async mockGenerateQR(data: string, options: QRGenerateOptions): Promise<string> {
    // Simulate QR generation processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock base64 encoded QR code
    const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return mockBase64;
  }

  // Method to handle QR code detection from camera
  handleQRCodeRead = (event: any) => {
    if (!this.isScanning) return;

    try {
      const scannedData = this.parseQRData(event.data);
      const result: QRScanResult = {
        success: true,
        data: scannedData,
        rawData: event.data
      };

      this.qrScanCallback?.(result);
    } catch (error: any) {
      const result: QRScanResult = {
        success: false,
        rawData: event.data,
        error: `Failed to parse QR code: ${error.message}`
      };

      this.qrScanCallback?.(result);
    }
  }

  private parseQRData(rawData: string): QRCodeData {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(rawData);
      if (parsed.type && parsed.data) {
        return parsed as QRCodeData;
      }
    } catch (error) {
      // Not JSON, treat as raw data
    }

    // Default parsing for non-structured data
    return {
      type: 'other',
      data: { value: rawData },
      timestamp: Date.now()
    };
  }
}