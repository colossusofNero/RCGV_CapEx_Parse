import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { INFCRepository, NFCTag, NFCReadResult, NFCWriteResult } from '@/domain/repositories/INFCRepository';

export class NFCDataSource implements INFCRepository {
  private isScanning: boolean = false;
  private tagDiscoveredCallback?: (tag: NFCTag) => void;
  private scanningStateCallback?: (isScanning: boolean) => void;

  async isEnabled(): Promise<boolean> {
    try {
      return await NfcManager.isEnabled();
    } catch (error) {
      return false;
    }
  }

  async isSupported(): Promise<boolean> {
    try {
      return await NfcManager.isSupported();
    } catch (error) {
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      await NfcManager.start();
      return true;
    } catch (error) {
      return false;
    }
  }

  async startScanning(): Promise<void> {
    try {
      if (this.isScanning) {
        return;
      }

      await NfcManager.requestTechnology(NfcTech.Ndef);
      this.isScanning = true;
      this.scanningStateCallback?.(true);

      // Set up tag discovery listener
      NfcManager.setEventListener('NfcManagerDiscoverTag', (tag) => {
        const nfcTag = this.convertToNFCTag(tag);
        this.tagDiscoveredCallback?.(nfcTag);
      });

    } catch (error: any) {
      this.isScanning = false;
      this.scanningStateCallback?.(false);
      throw new Error(`Failed to start NFC scanning: ${error.message}`);
    }
  }

  async stopScanning(): Promise<void> {
    try {
      await NfcManager.cancelTechnologyRequest();
      NfcManager.setEventListener('NfcManagerDiscoverTag', null);
      this.isScanning = false;
      this.scanningStateCallback?.(false);
    } catch (error: any) {
      throw new Error(`Failed to stop NFC scanning: ${error.message}`);
    }
  }

  async readTag(): Promise<NFCReadResult> {
    try {
      const tag = await NfcManager.getTag();
      if (!tag) {
        return { success: false, error: 'No tag found' };
      }

      const nfcTag = this.convertToNFCTag(tag);
      return { success: true, tag: nfcTag };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to read NFC tag' };
    }
  }

  async writeTag(data: Record<string, any>): Promise<NFCWriteResult> {
    try {
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(JSON.stringify(data))
      ]);

      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to write NFC tag' };
    }
  }

  onTagDiscovered(callback: (tag: NFCTag) => void): void {
    this.tagDiscoveredCallback = callback;
  }

  onScanningStateChange(callback: (isScanning: boolean) => void): void {
    this.scanningStateCallback = callback;
  }

  private convertToNFCTag(tag: any): NFCTag {
    return {
      id: tag.id || '',
      type: tag.type || 'unknown',
      techTypes: tag.techTypes || [],
      maxSize: tag.maxSize,
      isWritable: tag.isWritable || false,
      payload: this.extractPayload(tag)
    };
  }

  private extractPayload(tag: any): Record<string, any> | undefined {
    try {
      if (tag.ndefMessage && tag.ndefMessage.length > 0) {
        const ndefRecord = tag.ndefMessage[0];
        if (ndefRecord.payload) {
          const text = String.fromCharCode.apply(null, Array.from(ndefRecord.payload));
          return JSON.parse(text);
        }
      }
    } catch (error) {
      // If parsing fails, return raw payload
      return tag.ndefMessage ? { raw: tag.ndefMessage } : undefined;
    }
    return undefined;
  }
}