export interface QRCodeData {
  type: 'payment' | 'merchant_info' | 'tip_request' | 'other';
  data: Record<string, any>;
  timestamp: number;
}

export interface QRScanResult {
  success: boolean;
  data?: QRCodeData;
  rawData?: string;
  error?: string;
}

export interface QRGenerateOptions {
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

export interface IQRCodeRepository {
  startScanning(): Promise<void>;
  stopScanning(): Promise<void>;
  scanQRCode(): Promise<QRScanResult>;
  generateQRCode(data: QRCodeData, options?: QRGenerateOptions): Promise<string>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  onQRCodeScanned(callback: (result: QRScanResult) => void): void;
  onScanningStateChange(callback: (isScanning: boolean) => void): void;
}