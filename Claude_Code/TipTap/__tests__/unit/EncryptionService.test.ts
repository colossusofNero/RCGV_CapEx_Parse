import EncryptionService, { EncryptedData, EncryptionOptions } from '@/security/services/EncryptionService';

describe('EncryptionService', () => {
  const testPassword = 'test_password_123';
  const testData = 'This is sensitive test data';
  const testObject = {
    userId: '12345',
    cardNumber: '4111111111111111',
    cvv: '123',
    expiryDate: '12/25'
  };

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt text successfully', async () => {
      // Act
      const encryptedData = await EncryptionService.encrypt(testData, testPassword);
      const decryptedData = await EncryptionService.decrypt(encryptedData, testPassword);

      // Assert
      expect(decryptedData).toBe(testData);
      expect(encryptedData.ciphertext).toBeTruthy();
      expect(encryptedData.iv).toBeTruthy();
      expect(encryptedData.tag).toBeTruthy();
      expect(encryptedData.salt).toBeTruthy();
    });

    it('should return different ciphertext for same data with different passwords', async () => {
      // Arrange
      const password1 = 'password1';
      const password2 = 'password2';

      // Act
      const encrypted1 = await EncryptionService.encrypt(testData, password1);
      const encrypted2 = await EncryptionService.encrypt(testData, password2);

      // Assert
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should return different ciphertext for same data and password (due to random salt/iv)', async () => {
      // Act
      const encrypted1 = await EncryptionService.encrypt(testData, testPassword);
      const encrypted2 = await EncryptionService.encrypt(testData, testPassword);

      // Assert
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Both should decrypt to same original data
      const decrypted1 = await EncryptionService.decrypt(encrypted1, testPassword);
      const decrypted2 = await EncryptionService.decrypt(encrypted2, testPassword);
      expect(decrypted1).toBe(testData);
      expect(decrypted2).toBe(testData);
    });

    it('should fail decryption with wrong password', async () => {
      // Arrange
      const encryptedData = await EncryptionService.encrypt(testData, testPassword);
      const wrongPassword = 'wrong_password';

      // Act & Assert
      await expect(EncryptionService.decrypt(encryptedData, wrongPassword))
        .rejects.toThrow('Decryption failed');
    });

    it('should fail decryption with corrupted data', async () => {
      // Arrange
      const encryptedData = await EncryptionService.encrypt(testData, testPassword);
      const corruptedData: EncryptedData = {
        ...encryptedData,
        ciphertext: 'corrupted_base64_data'
      };

      // Act & Assert
      await expect(EncryptionService.decrypt(corruptedData, testPassword))
        .rejects.toThrow('Decryption failed');
    });

    it('should fail decryption with corrupted salt', async () => {
      // Arrange
      const encryptedData = await EncryptionService.encrypt(testData, testPassword);
      const corruptedData: EncryptedData = {
        ...encryptedData,
        salt: 'invalid_salt'
      };

      // Act & Assert
      await expect(EncryptionService.decrypt(corruptedData, testPassword))
        .rejects.toThrow('Decryption failed');
    });

    it('should fail decryption with corrupted iv', async () => {
      // Arrange
      const encryptedData = await EncryptionService.encrypt(testData, testPassword);
      const corruptedData: EncryptedData = {
        ...encryptedData,
        iv: 'invalid_iv'
      };

      // Act & Assert
      await expect(EncryptionService.decrypt(corruptedData, testPassword))
        .rejects.toThrow('Decryption failed');
    });

    it('should fail decryption with corrupted tag', async () => {
      // Arrange
      const encryptedData = await EncryptionService.encrypt(testData, testPassword);
      const corruptedData: EncryptedData = {
        ...encryptedData,
        tag: 'invalid_tag'
      };

      // Act & Assert
      await expect(EncryptionService.decrypt(corruptedData, testPassword))
        .rejects.toThrow('Decryption failed');
    });

    it('should handle empty string encryption/decryption', async () => {
      // Arrange
      const emptyString = '';

      // Act
      const encryptedData = await EncryptionService.encrypt(emptyString, testPassword);
      const decryptedData = await EncryptionService.decrypt(encryptedData, testPassword);

      // Assert
      expect(decryptedData).toBe(emptyString);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const unicodeText = 'Hello 世界 🌍 Café naïve résumé';

      // Act
      const encryptedData = await EncryptionService.encrypt(unicodeText, testPassword);
      const decryptedData = await EncryptionService.decrypt(encryptedData, testPassword);

      // Assert
      expect(decryptedData).toBe(unicodeText);
    });

    it('should handle large text data', async () => {
      // Arrange
      const largeText = 'A'.repeat(10000);

      // Act
      const encryptedData = await EncryptionService.encrypt(largeText, testPassword);
      const decryptedData = await EncryptionService.decrypt(encryptedData, testPassword);

      // Assert
      expect(decryptedData).toBe(largeText);
      expect(decryptedData.length).toBe(10000);
    });
  });

  describe('encryptObject/decryptObject', () => {
    it('should encrypt and decrypt objects successfully', async () => {
      // Act
      const encryptedData = await EncryptionService.encryptObject(testObject, testPassword);
      const decryptedObject = await EncryptionService.decryptObject(encryptedData, testPassword);

      // Assert
      expect(decryptedObject).toEqual(testObject);
    });

    it('should handle nested objects', async () => {
      // Arrange
      const nestedObject = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        cards: [
          { number: '4111111111111111', cvv: '123' },
          { number: '5555555555554444', cvv: '456' }
        ]
      };

      // Act
      const encryptedData = await EncryptionService.encryptObject(nestedObject, testPassword);
      const decryptedObject = await EncryptionService.decryptObject(encryptedData, testPassword);

      // Assert
      expect(decryptedObject).toEqual(nestedObject);
    });

    it('should handle objects with null and undefined values', async () => {
      // Arrange
      const objectWithNulls = {
        value1: null,
        value2: undefined,
        value3: 'test',
        value4: 0,
        value5: false
      };

      // Act
      const encryptedData = await EncryptionService.encryptObject(objectWithNulls, testPassword);
      const decryptedObject = await EncryptionService.decryptObject(encryptedData, testPassword);

      // Assert
      // Note: undefined values are lost during JSON.stringify/parse
      expect(decryptedObject).toEqual({
        value1: null,
        value3: 'test',
        value4: 0,
        value5: false
      });
    });

    it('should fail to decrypt object with wrong password', async () => {
      // Arrange
      const encryptedData = await EncryptionService.encryptObject(testObject, testPassword);
      const wrongPassword = 'wrong_password';

      // Act & Assert
      await expect(EncryptionService.decryptObject(encryptedData, wrongPassword))
        .rejects.toThrow('Decryption failed');
    });

    it('should fail to parse corrupted decrypted JSON', async () => {
      // Arrange
      const invalidJson = '{"invalid": json}';
      const encryptedData = await EncryptionService.encrypt(invalidJson, testPassword);

      // Act & Assert
      await expect(EncryptionService.decryptObject(encryptedData, testPassword))
        .rejects.toThrow('Failed to parse decrypted JSON data');
    });

    it('should handle empty objects', async () => {
      // Arrange
      const emptyObject = {};

      // Act
      const encryptedData = await EncryptionService.encryptObject(emptyObject, testPassword);
      const decryptedObject = await EncryptionService.decryptObject(encryptedData, testPassword);

      // Assert
      expect(decryptedObject).toEqual(emptyObject);
    });

    it('should handle arrays', async () => {
      // Arrange
      const testArray = [1, 'two', { three: 3 }, [4, 5]];

      // Act
      const encryptedData = await EncryptionService.encryptObject(testArray, testPassword);
      const decryptedArray = await EncryptionService.decryptObject(encryptedData, testPassword);

      // Assert
      expect(decryptedArray).toEqual(testArray);
    });
  });

  describe('encryption options', () => {
    it('should use custom encryption options', async () => {
      // Arrange
      const customOptions: EncryptionOptions = {
        keyDerivationIterations: 5000,
        keySize: 8,
        ivSize: 12,
        tagSize: 16
      };

      // Act
      const encryptedData = await EncryptionService.encrypt(testData, testPassword, customOptions);
      const decryptedData = await EncryptionService.decrypt(encryptedData, testPassword, customOptions);

      // Assert
      expect(decryptedData).toBe(testData);
    });

    it('should fail decryption with mismatched options', async () => {
      // Arrange
      const encryptOptions: EncryptionOptions = {
        keyDerivationIterations: 5000
      };
      const decryptOptions: EncryptionOptions = {
        keyDerivationIterations: 10000
      };

      const encryptedData = await EncryptionService.encrypt(testData, testPassword, encryptOptions);

      // Act & Assert
      await expect(EncryptionService.decrypt(encryptedData, testPassword, decryptOptions))
        .rejects.toThrow('Decryption failed');
    });
  });

  describe('generateSecureKey', () => {
    it('should generate secure keys of specified length', () => {
      // Act
      const key16 = EncryptionService.generateSecureKey(16);
      const key32 = EncryptionService.generateSecureKey(32);
      const key64 = EncryptionService.generateSecureKey(64);

      // Assert
      expect(key16).toHaveLength(32); // 16 bytes = 32 hex characters
      expect(key32).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(key64).toHaveLength(128); // 64 bytes = 128 hex characters
      expect(key16).toMatch(/^[0-9a-f]+$/i);
      expect(key32).toMatch(/^[0-9a-f]+$/i);
      expect(key64).toMatch(/^[0-9a-f]+$/i);
    });

    it('should generate different keys each time', () => {
      // Act
      const key1 = EncryptionService.generateSecureKey(32);
      const key2 = EncryptionService.generateSecureKey(32);

      // Assert
      expect(key1).not.toBe(key2);
    });

    it('should use default length when no length specified', () => {
      // Act
      const key = EncryptionService.generateSecureKey();

      // Assert
      expect(key).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it('should handle edge case of length 0', () => {
      // Act
      const key = EncryptionService.generateSecureKey(0);

      // Assert
      expect(key).toHaveLength(0);
      expect(key).toBe('');
    });
  });

  describe('password hashing and verification', () => {
    const testPasswordForHashing = 'my_secure_password_123';

    it('should hash and verify password successfully', async () => {
      // Act
      const { hash, salt } = await EncryptionService.hashPassword(testPasswordForHashing);
      const isValid = await EncryptionService.verifyPassword(testPasswordForHashing, hash, salt);

      // Assert
      expect(hash).toBeTruthy();
      expect(salt).toBeTruthy();
      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong password', async () => {
      // Arrange
      const { hash, salt } = await EncryptionService.hashPassword(testPasswordForHashing);
      const wrongPassword = 'wrong_password';

      // Act
      const isValid = await EncryptionService.verifyPassword(wrongPassword, hash, salt);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should generate different hash for same password each time (different salt)', async () => {
      // Act
      const result1 = await EncryptionService.hashPassword(testPasswordForHashing);
      const result2 = await EncryptionService.hashPassword(testPasswordForHashing);

      // Assert
      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);

      // Both should verify correctly
      const isValid1 = await EncryptionService.verifyPassword(testPasswordForHashing, result1.hash, result1.salt);
      const isValid2 = await EncryptionService.verifyPassword(testPasswordForHashing, result2.hash, result2.salt);
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });

    it('should use provided salt when specified', async () => {
      // Arrange
      const customSalt = 'custom_test_salt';

      // Act
      const { hash: hash1, salt: salt1 } = await EncryptionService.hashPassword(testPasswordForHashing, customSalt);
      const { hash: hash2, salt: salt2 } = await EncryptionService.hashPassword(testPasswordForHashing, customSalt);

      // Assert
      expect(salt1).toBe(customSalt);
      expect(salt2).toBe(customSalt);
      expect(hash1).toBe(hash2); // Same password + same salt = same hash
    });

    it('should handle empty password', async () => {
      // Arrange
      const emptyPassword = '';

      // Act
      const { hash, salt } = await EncryptionService.hashPassword(emptyPassword);
      const isValid = await EncryptionService.verifyPassword(emptyPassword, hash, salt);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      // Arrange
      const unicodePassword = 'pássword123🔒';

      // Act
      const { hash, salt } = await EncryptionService.hashPassword(unicodePassword);
      const isValid = await EncryptionService.verifyPassword(unicodePassword, hash, salt);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should be case sensitive', async () => {
      // Arrange
      const password = 'MyPassword123';
      const { hash, salt } = await EncryptionService.hashPassword(password);

      // Act
      const isValidLowercase = await EncryptionService.verifyPassword('mypassword123', hash, salt);
      const isValidUppercase = await EncryptionService.verifyPassword('MYPASSWORD123', hash, salt);
      const isValidCorrect = await EncryptionService.verifyPassword(password, hash, salt);

      // Assert
      expect(isValidLowercase).toBe(false);
      expect(isValidUppercase).toBe(false);
      expect(isValidCorrect).toBe(true);
    });
  });
});