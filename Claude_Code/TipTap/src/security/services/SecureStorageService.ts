import * as Keychain from 'react-native-keychain';
import EncryptionService, { EncryptedData } from './EncryptionService';

export interface SecureStorageOptions {
  service?: string;
  accessGroup?: string;
  touchID?: boolean;
  showModal?: boolean;
  kLocalizedFallbackTitle?: string;
}

export interface SecureItem {
  username: string;
  password: string;
  service?: string;
}

class SecureStorageService {
  private readonly DEFAULT_SERVICE = 'TipTapSecureStorage';

  async setItem(
    key: string,
    value: string,
    options: SecureStorageOptions = {}
  ): Promise<boolean> {
    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || `${this.DEFAULT_SERVICE}_${key}`,
        accessControl: options.touchID ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : undefined,
        accessGroup: options.accessGroup,
        authenticatePrompt: 'Authenticate to store secure data',
        showModal: options.showModal !== false,
        kLocalizedFallbackTitle: options.kLocalizedFallbackTitle || 'Enter Passcode'
      };

      const result = await Keychain.setInternetCredentials(
        keychainOptions.service!,
        key,
        value,
        keychainOptions
      );

      return result !== false;
    } catch (error) {
      console.error('SecureStorageService setItem error:', error);
      return false;
    }
  }

  async getItem(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<string | null> {
    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || `${this.DEFAULT_SERVICE}_${key}`,
        accessControl: options.touchID ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : undefined,
        accessGroup: options.accessGroup,
        authenticatePrompt: 'Authenticate to retrieve secure data',
        showModal: options.showModal !== false,
        kLocalizedFallbackTitle: options.kLocalizedFallbackTitle || 'Enter Passcode'
      };

      const credentials = await Keychain.getInternetCredentials(
        keychainOptions.service!,
        keychainOptions
      );

      if (credentials && credentials !== false) {
        return credentials.password;
      }

      return null;
    } catch (error) {
      console.error('SecureStorageService getItem error:', error);
      return null;
    }
  }

  async removeItem(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<boolean> {
    try {
      const service = options.service || `${this.DEFAULT_SERVICE}_${key}`;
      const result = await Keychain.resetInternetCredentials(service);
      return result;
    } catch (error) {
      console.error('SecureStorageService removeItem error:', error);
      return false;
    }
  }

  async setSecureObject<T = Record<string, any>>(
    key: string,
    obj: T,
    password: string,
    options: SecureStorageOptions = {}
  ): Promise<boolean> {
    try {
      const encryptedData = await EncryptionService.encryptObject(obj, password);
      const serializedData = JSON.stringify(encryptedData);
      return await this.setItem(key, serializedData, options);
    } catch (error) {
      console.error('SecureStorageService setSecureObject error:', error);
      return false;
    }
  }

  async getSecureObject<T = Record<string, any>>(
    key: string,
    password: string,
    options: SecureStorageOptions = {}
  ): Promise<T | null> {
    try {
      const serializedData = await this.getItem(key, options);
      if (!serializedData) {
        return null;
      }

      const encryptedData: EncryptedData = JSON.parse(serializedData);
      const decryptedObj = await EncryptionService.decryptObject<T>(encryptedData, password);
      return decryptedObj;
    } catch (error) {
      console.error('SecureStorageService getSecureObject error:', error);
      return null;
    }
  }

  async getAllServices(): Promise<string[]> {
    try {
      const result = await Keychain.getAllInternetCredentials();
      if (Array.isArray(result)) {
        return result.map(item => item.service);
      }
      return [];
    } catch (error) {
      console.error('SecureStorageService getAllServices error:', error);
      return [];
    }
  }

  async clearAll(): Promise<boolean> {
    try {
      const services = await this.getAllServices();
      const promises = services.map(service =>
        Keychain.resetInternetCredentials(service)
      );

      const results = await Promise.all(promises);
      return results.every(result => result === true);
    } catch (error) {
      console.error('SecureStorageService clearAll error:', error);
      return false;
    }
  }

  async getSupportedBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType;
    } catch (error) {
      console.error('SecureStorageService getSupportedBiometryType error:', error);
      return null;
    }
  }

  async hasInternetCredentials(service: string): Promise<boolean> {
    try {
      const result = await Keychain.hasInternetCredentials(service);
      return result;
    } catch (error) {
      console.error('SecureStorageService hasInternetCredentials error:', error);
      return false;
    }
  }

  async setUserCredentials(
    username: string,
    password: string,
    options: SecureStorageOptions = {}
  ): Promise<boolean> {
    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || this.DEFAULT_SERVICE,
        accessControl: options.touchID ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : undefined,
        accessGroup: options.accessGroup,
        authenticatePrompt: 'Authenticate to store credentials',
        showModal: options.showModal !== false,
        kLocalizedFallbackTitle: options.kLocalizedFallbackTitle || 'Enter Passcode'
      };

      const result = await Keychain.setInternetCredentials(
        keychainOptions.service!,
        username,
        password,
        keychainOptions
      );

      return result !== false;
    } catch (error) {
      console.error('SecureStorageService setUserCredentials error:', error);
      return false;
    }
  }

  async getUserCredentials(
    options: SecureStorageOptions = {}
  ): Promise<SecureItem | null> {
    try {
      const keychainOptions: Keychain.Options = {
        service: options.service || this.DEFAULT_SERVICE,
        accessControl: options.touchID ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : undefined,
        accessGroup: options.accessGroup,
        authenticatePrompt: 'Authenticate to retrieve credentials',
        showModal: options.showModal !== false,
        kLocalizedFallbackTitle: options.kLocalizedFallbackTitle || 'Enter Passcode'
      };

      const credentials = await Keychain.getInternetCredentials(
        keychainOptions.service!,
        keychainOptions
      );

      if (credentials && credentials !== false) {
        return {
          username: credentials.username,
          password: credentials.password,
          service: credentials.service
        };
      }

      return null;
    } catch (error) {
      console.error('SecureStorageService getUserCredentials error:', error);
      return null;
    }
  }
}

export default new SecureStorageService();