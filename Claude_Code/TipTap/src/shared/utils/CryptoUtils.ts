import CryptoJS from 'crypto-js';

export class CryptoUtils {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  private static readonly IV_LENGTH = 16; // 16 bytes for AES

  /**
   * Encrypts sensitive data using AES encryption
   */
  static encrypt(plainText: string): string {
    try {
      const iv = CryptoJS.lib.WordArray.random(this.IV_LENGTH);
      const encrypted = CryptoJS.AES.encrypt(plainText, this.ENCRYPTION_KEY, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Combine IV and encrypted data
      const combined = iv.concat(encrypted.ciphertext);
      return CryptoJS.enc.Base64.stringify(combined);
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypts encrypted data
   */
  static decrypt(encryptedData: string): string {
    try {
      const combined = CryptoJS.enc.Base64.parse(encryptedData);
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, this.IV_LENGTH / 4));
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(this.IV_LENGTH / 4));

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as any,
        this.ENCRYPTION_KEY,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Generates a secure hash of sensitive data
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }

  /**
   * Generates a secure random string
   */
  static generateRandomString(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
  }

  /**
   * Generates HMAC signature for data integrity
   */
  static generateHMAC(data: string, secret?: string): string {
    const hmacSecret = secret || this.ENCRYPTION_KEY;
    return CryptoJS.HmacSHA256(data, hmacSecret).toString(CryptoJS.enc.Hex);
  }

  /**
   * Verifies HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return expectedSignature === signature;
  }

  /**
   * Encrypts payment card data (PCI DSS compliant approach)
   */
  static encryptPaymentData(cardData: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
  }): string {
    // In production, this should use proper PCI DSS compliant encryption
    // and card data should never be stored on device
    const sanitizedData = {
      cardNumber: cardData.cardNumber ? this.maskCardNumber(cardData.cardNumber) : undefined,
      expiryDate: cardData.expiryDate,
      // Never encrypt/store CVV
      cvv: undefined
    };

    return this.encrypt(JSON.stringify(sanitizedData));
  }

  /**
   * Masks card number for display purposes
   */
  static maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) return cardNumber;
    return '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4);
  }

  /**
   * Validates if encrypted data is valid
   */
  static isValidEncryptedData(encryptedData: string): boolean {
    try {
      const decrypted = this.decrypt(encryptedData);
      return decrypted.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Encrypts transaction limits data
   */
  static encryptTransactionLimits(limits: {
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
  }): string {
    return this.encrypt(JSON.stringify(limits));
  }

  /**
   * Decrypts transaction limits data
   */
  static decryptTransactionLimits(encryptedLimits: string): {
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
  } {
    const decryptedData = this.decrypt(encryptedLimits);
    return JSON.parse(decryptedData);
  }

  /**
   * Generates secure transaction ID
   */
  static generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = this.generateRandomString(8);
    return `txn_${timestamp}_${random}`;
  }

  /**
   * Encrypts sensitive user data
   */
  static encryptUserData(userData: {
    email?: string;
    phone?: string;
    bankAccount?: string;
  }): string {
    // Hash email for privacy
    const sanitizedData = {
      emailHash: userData.email ? this.hash(userData.email) : undefined,
      phone: userData.phone ? this.maskPhoneNumber(userData.phone) : undefined,
      bankAccount: userData.bankAccount ? this.maskBankAccount(userData.bankAccount) : undefined
    };

    return this.encrypt(JSON.stringify(sanitizedData));
  }

  /**
   * Masks phone number for display
   */
  private static maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return phone;
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  /**
   * Masks bank account for display
   */
  private static maskBankAccount(accountNumber: string): string {
    if (accountNumber.length < 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }
}