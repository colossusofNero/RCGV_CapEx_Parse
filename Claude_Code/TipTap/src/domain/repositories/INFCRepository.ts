export interface NFCTag {
  id: string;
  type: string;
  techTypes: string[];
  maxSize?: number;
  isWritable: boolean;
  payload?: Record<string, any>;
}

export interface NFCReadResult {
  success: boolean;
  tag?: NFCTag;
  error?: string;
}

export interface NFCWriteResult {
  success: boolean;
  error?: string;
}

export interface INFCRepository {
  isEnabled(): Promise<boolean>;
  isSupported(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  startScanning(): Promise<void>;
  stopScanning(): Promise<void>;
  readTag(): Promise<NFCReadResult>;
  writeTag(data: Record<string, any>): Promise<NFCWriteResult>;
  onTagDiscovered(callback: (tag: NFCTag) => void): void;
  onScanningStateChange(callback: (isScanning: boolean) => void): void;
}