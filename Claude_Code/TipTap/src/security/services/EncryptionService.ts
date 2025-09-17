import CryptoJS from 'crypto-js';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
}

export interface EncryptionOptions {
  keyDerivationIterations?: number;
  keySize?: number;
  ivSize?: number;
  tagSize?: number;
}

class EncryptionService {
  private readonly DEFAULT_OPTIONS: Required<EncryptionOptions> = {
    keyDerivationIterations: 10000,
    keySize: 256 / 32,
    ivSize: 96 / 8,
    tagSize: 128 / 8
  };

  async encrypt(
    plaintext: string,
    password: string,
    options: EncryptionOptions = {}
  ): Promise<EncryptedData> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const iv = CryptoJS.lib.WordArray.random(config.ivSize * 8);

    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: config.keySize,
      iterations: config.keyDerivationIterations,
      hasher: CryptoJS.algo.SHA256
    });

    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });

    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    const tag = encrypted.tag ? encrypted.tag.toString(CryptoJS.enc.Base64) : '';

    return {
      ciphertext,
      iv: iv.toString(CryptoJS.enc.Base64),
      tag,
      salt: salt.toString(CryptoJS.enc.Base64)
    };
  }

  async decrypt(
    encryptedData: EncryptedData,
    password: string,
    options: EncryptionOptions = {}
  ): Promise<string> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    const salt = CryptoJS.enc.Base64.parse(encryptedData.salt);
    const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedData.ciphertext);
    const tag = CryptoJS.enc.Base64.parse(encryptedData.tag);

    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: config.keySize,
      iterations: config.keyDerivationIterations,
      hasher: CryptoJS.algo.SHA256
    });

    try {
      const decrypted = CryptoJS.AES.decrypt(
        {
          ciphertext: ciphertext,
          tag: tag
        } as any,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.GCM,
          padding: CryptoJS.pad.NoPadding
        }
      );

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        throw new Error('Decryption failed - invalid password or corrupted data');
      }

      return decryptedText;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async encryptObject(
    obj: Record<string, any>,
    password: string,
    options: EncryptionOptions = {}
  ): Promise<EncryptedData> {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, password, options);
  }

  async decryptObject<T = Record<string, any>>(
    encryptedData: EncryptedData,
    password: string,
    options: EncryptionOptions = {}
  ): Promise<T> {
    const jsonString = await this.decrypt(encryptedData, password, options);
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error('Failed to parse decrypted JSON data');
    }
  }

  generateSecureKey(length: number = 32): string {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const usedSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Base64);

    const hash = CryptoJS.PBKDF2(password, usedSalt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256
    }).toString(CryptoJS.enc.Base64);

    return { hash, salt: usedSalt };
  }

  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const { hash: computedHash } = await this.hashPassword(password, salt);
    return computedHash === hash;
  }
}

export default new EncryptionService();