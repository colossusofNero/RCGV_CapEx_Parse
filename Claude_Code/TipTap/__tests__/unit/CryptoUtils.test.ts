import { CryptoUtils } from '@/shared/utils/CryptoUtils';

describe('CryptoUtils', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plainText = 'sensitive data';
      const encrypted = CryptoUtils.encrypt(plainText);
      const decrypted = CryptoUtils.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
      expect(encrypted).not.toBe(plainText);
    });

    it('should produce different encrypted values for same input', () => {
      const plainText = 'test data';
      const encrypted1 = CryptoUtils.encrypt(plainText);
      const encrypted2 = CryptoUtils.encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2);
      expect(CryptoUtils.decrypt(encrypted1)).toBe(plainText);
      expect(CryptoUtils.decrypt(encrypted2)).toBe(plainText);
    });

    it('should handle empty string', () => {
      const plainText = '';
      const encrypted = CryptoUtils.encrypt(plainText);
      const decrypted = CryptoUtils.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should handle special characters', () => {
      const plainText = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 🔐';
      const encrypted = CryptoUtils.encrypt(plainText);
      const decrypted = CryptoUtils.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => CryptoUtils.decrypt('invalid-encrypted-data'))
        .toThrow('Decryption failed');
    });
  });

  describe('hash', () => {
    it('should generate consistent hash for same input', () => {
      const data = 'test@example.com';
      const hash1 = CryptoUtils.hash(data);
      const hash2 = CryptoUtils.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 produces 64 character hex string
    });

    it('should generate different hashes for different inputs', () => {
      const data1 = 'test@example.com';
      const data2 = 'test2@example.com';
      const hash1 = CryptoUtils.hash(data1);
      const hash2 = CryptoUtils.hash(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateRandomString', () => {
    it('should generate random string of specified length', () => {
      const random1 = CryptoUtils.generateRandomString(16);
      const random2 = CryptoUtils.generateRandomString(16);

      expect(random1).toHaveLength(32); // hex encoding doubles length
      expect(random2).toHaveLength(32);
      expect(random1).not.toBe(random2);
    });

    it('should generate different lengths', () => {
      const short = CryptoUtils.generateRandomString(8);
      const long = CryptoUtils.generateRandomString(32);

      expect(short).toHaveLength(16);
      expect(long).toHaveLength(64);
    });
  });

  describe('HMAC generation and verification', () => {
    it('should generate and verify HMAC correctly', () => {
      const data = 'important data';
      const signature = CryptoUtils.generateHMAC(data);
      const isValid = CryptoUtils.verifyHMAC(data, signature);

      expect(isValid).toBe(true);
      expect(signature).toHaveLength(64); // HMAC-SHA256 produces 64 character hex
    });

    it('should fail verification with wrong data', () => {
      const data = 'important data';
      const wrongData = 'wrong data';
      const signature = CryptoUtils.generateHMAC(data);
      const isValid = CryptoUtils.verifyHMAC(wrongData, signature);

      expect(isValid).toBe(false);
    });

    it('should work with custom secret', () => {
      const data = 'test data';
      const secret = 'custom-secret';
      const signature = CryptoUtils.generateHMAC(data, secret);
      const isValid = CryptoUtils.verifyHMAC(data, signature, secret);

      expect(isValid).toBe(true);
    });
  });

  describe('payment data encryption', () => {
    it('should encrypt payment data securely', () => {
      const cardData = {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123'
      };

      const encrypted = CryptoUtils.encryptPaymentData(cardData);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toContain(cardData.cardNumber);
      expect(encrypted).not.toContain(cardData.cvv);
    });

    it('should handle partial card data', () => {
      const cardData = {
        cardNumber: '4111111111111111'
      };

      const encrypted = CryptoUtils.encryptPaymentData(cardData);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('card number masking', () => {
    it('should mask card number correctly', () => {
      const cardNumber = '4111111111111111';
      const masked = CryptoUtils.maskCardNumber(cardNumber);

      expect(masked).toBe('************1111');
      expect(masked).toContain('1111');
      expect(masked.length).toBe(cardNumber.length);
    });

    it('should handle short card numbers', () => {
      const cardNumber = '123';
      const masked = CryptoUtils.maskCardNumber(cardNumber);

      expect(masked).toBe('123');
    });
  });

  describe('transaction limits encryption', () => {
    it('should encrypt and decrypt transaction limits', () => {
      const limits = {
        dailyLimit: 1000,
        monthlyLimit: 5000,
        perTransactionLimit: 500
      };

      const encrypted = CryptoUtils.encryptTransactionLimits(limits);
      const decrypted = CryptoUtils.decryptTransactionLimits(encrypted);

      expect(decrypted).toEqual(limits);
    });

    it('should handle zero limits', () => {
      const limits = {
        dailyLimit: 0,
        monthlyLimit: 0,
        perTransactionLimit: 0
      };

      const encrypted = CryptoUtils.encryptTransactionLimits(limits);
      const decrypted = CryptoUtils.decryptTransactionLimits(encrypted);

      expect(decrypted).toEqual(limits);
    });
  });

  describe('user data encryption', () => {
    it('should encrypt user data with hashing for email', () => {
      const userData = {
        email: 'user@example.com',
        phone: '1234567890',
        bankAccount: '123456789012'
      };

      const encrypted = CryptoUtils.encryptUserData(userData);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toContain(userData.email);
      expect(encrypted).not.toContain(userData.phone);
      expect(encrypted).not.toContain(userData.bankAccount);
    });

    it('should handle partial user data', () => {
      const userData = {
        email: 'user@example.com'
      };

      const encrypted = CryptoUtils.encryptUserData(userData);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('transaction ID generation', () => {
    it('should generate unique transaction IDs', () => {
      const id1 = CryptoUtils.generateTransactionId();
      const id2 = CryptoUtils.generateTransactionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^txn_\d+_[a-f0-9]+$/);
      expect(id2).toMatch(/^txn_\d+_[a-f0-9]+$/);
    });

    it('should include timestamp in transaction ID', () => {
      const beforeTime = Date.now();
      const id = CryptoUtils.generateTransactionId();
      const afterTime = Date.now();

      const timestampMatch = id.match(/^txn_(\d+)_/);
      expect(timestampMatch).toBeTruthy();

      const timestamp = parseInt(timestampMatch![1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('validation', () => {
    it('should validate encrypted data', () => {
      const plainText = 'valid data';
      const encrypted = CryptoUtils.encrypt(plainText);

      expect(CryptoUtils.isValidEncryptedData(encrypted)).toBe(true);
      expect(CryptoUtils.isValidEncryptedData('invalid-data')).toBe(false);
      expect(CryptoUtils.isValidEncryptedData('')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle encryption errors gracefully', () => {
      // Mock CryptoJS to throw an error
      const originalEncrypt = require('crypto-js').AES.encrypt;
      require('crypto-js').AES.encrypt = jest.fn(() => {
        throw new Error('Encryption failed');
      });

      expect(() => CryptoUtils.encrypt('test'))
        .toThrow('Encryption failed');

      // Restore original function
      require('crypto-js').AES.encrypt = originalEncrypt;
    });

    it('should handle decryption errors gracefully', () => {
      expect(() => CryptoUtils.decrypt('malformed-data'))
        .toThrow('Decryption failed');
    });
  });

  describe('security considerations', () => {
    it('should not store CVV in encrypted payment data', () => {
      const cardData = {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123'
      };

      const encrypted = CryptoUtils.encryptPaymentData(cardData);
      const decrypted = CryptoUtils.decrypt(encrypted);
      const parsedData = JSON.parse(decrypted);

      expect(parsedData.cvv).toBeUndefined();
    });

    it('should mask sensitive data in encrypted payment data', () => {
      const cardData = {
        cardNumber: '4111111111111111'
      };

      const encrypted = CryptoUtils.encryptPaymentData(cardData);
      const decrypted = CryptoUtils.decrypt(encrypted);
      const parsedData = JSON.parse(decrypted);

      expect(parsedData.cardNumber).toBe('************1111');
    });

    it('should hash email instead of encrypting it directly', () => {
      const userData = {
        email: 'user@example.com'
      };

      const encrypted = CryptoUtils.encryptUserData(userData);
      const decrypted = CryptoUtils.decrypt(encrypted);
      const parsedData = JSON.parse(decrypted);

      expect(parsedData.emailHash).toBeTruthy();
      expect(parsedData.email).toBeUndefined();
      expect(parsedData.emailHash).toBe(CryptoUtils.hash(userData.email));
    });
  });
});