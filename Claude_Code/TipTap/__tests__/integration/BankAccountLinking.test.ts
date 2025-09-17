import PlaidService from '@/services/PlaidService';
import { PaymentService } from '@/application/services/PaymentService';
import { PaymentMethod, TransactionStatus } from '@/domain/entities/Transaction';

// Mock Plaid Link SDK
const mockPlaidLink = {
  create: jest.fn(),
  destroy: jest.fn(),
  open: jest.fn(),
  exit: jest.fn(),
  onSuccess: jest.fn(),
  onExit: jest.fn(),
  onEvent: jest.fn()
};

jest.mock('react-native-plaid-link-sdk', () => ({
  PlaidLink: mockPlaidLink,
  LinkSuccess: jest.fn(),
  LinkExit: jest.fn(),
  LinkEvent: jest.fn(),
  LinkIOSPresentationStyle: {
    MODAL: 'modal',
    FULL_SCREEN: 'fullScreen'
  },
  LinkLogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  }
}));

// Mock SecureStorageService
const mockSecureStorage = {
  store: jest.fn(),
  retrieve: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn()
};

jest.mock('@/security/services/SecureStorageService', () => ({
  default: mockSecureStorage
}));

// Mock EncryptionService
const mockEncryption = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  encryptObject: jest.fn(),
  decryptObject: jest.fn()
};

jest.mock('@/security/services/EncryptionService', () => ({
  default: mockEncryption
}));

interface BankAccount {
  id: string;
  accountId: string;
  accessToken: string;
  accountName: string;
  accountType: string;
  accountSubtype: string;
  mask: string;
  institutionName: string;
  isVerified: boolean;
  isActive: boolean;
  linkedAt: Date;
  lastUsed?: Date;
}

interface PlaidLinkResult {
  publicToken: string;
  metadata: {
    institution: {
      name: string;
      institution_id: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      subtype: string;
      mask: string;
    }>;
    link_session_id: string;
  };
}

class BankAccountLinkingService {
  private plaidService: PlaidService;
  private linkedAccounts: Map<string, BankAccount> = new Map();
  private linkingInProgress = false;

  constructor() {
    this.plaidService = PlaidService.getInstance();
  }

  async initiateBankLinking(userId: string): Promise<{ success: boolean; linkToken?: string; error?: string }> {
    try {
      if (this.linkingInProgress) {
        return { success: false, error: 'Bank linking already in progress' };
      }

      this.linkingInProgress = true;

      // Create Plaid link token
      const linkToken = await this.plaidService.createLinkToken({
        userId,
        clientName: 'TipTap',
        products: ['transactions', 'auth'],
        countryCodes: ['US', 'CA'],
        language: 'en'
      });

      return { success: true, linkToken };

    } catch (error) {
      this.linkingInProgress = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate bank linking'
      };
    }
  }

  async completeBankLinking(
    userId: string,
    plaidResult: PlaidLinkResult
  ): Promise<{ success: boolean; accounts?: BankAccount[]; error?: string }> {
    try {
      if (!this.linkingInProgress) {
        return { success: false, error: 'No linking process in progress' };
      }

      // Exchange public token for access token
      const tokenExchangeResult = await this.plaidService.exchangePublicToken(plaidResult.publicToken);

      if (!tokenExchangeResult.access_token) {
        return { success: false, error: 'Failed to exchange public token' };
      }

      // Get account information
      const accountsInfo = await this.plaidService.getAccounts(tokenExchangeResult.access_token);

      // Create bank account records
      const linkedAccounts: BankAccount[] = [];

      for (const plaidAccount of accountsInfo.accounts) {
        const bankAccount: BankAccount = {
          id: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          accountId: plaidAccount.account_id,
          accessToken: tokenExchangeResult.access_token,
          accountName: plaidAccount.name,
          accountType: plaidAccount.type,
          accountSubtype: plaidAccount.subtype || '',
          mask: plaidAccount.mask || '',
          institutionName: plaidResult.metadata.institution.name,
          isVerified: true,
          isActive: true,
          linkedAt: new Date()
        };

        // Encrypt and store securely
        await this.securelyStoreBankAccount(userId, bankAccount);

        this.linkedAccounts.set(bankAccount.id, bankAccount);
        linkedAccounts.push(bankAccount);
      }

      this.linkingInProgress = false;

      return { success: true, accounts: linkedAccounts };

    } catch (error) {
      this.linkingInProgress = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete bank linking'
      };
    }
  }

  async getUserBankAccounts(userId: string): Promise<{ success: boolean; accounts?: BankAccount[]; error?: string }> {
    try {
      const accounts = await this.loadUserBankAccounts(userId);
      return { success: true, accounts };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load bank accounts'
      };
    }
  }

  async unlinkBankAccount(userId: string, accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove from memory
      this.linkedAccounts.delete(accountId);

      // Remove from secure storage
      await mockSecureStorage.delete(`bank_account_${userId}_${accountId}`);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlink bank account'
      };
    }
  }

  async verifyBankAccount(userId: string, accountId: string): Promise<{ success: boolean; isVerified?: boolean; error?: string }> {
    try {
      const account = this.linkedAccounts.get(accountId);
      if (!account) {
        return { success: false, error: 'Bank account not found' };
      }

      // Verify account with Plaid
      const authResult = await this.plaidService.getAuth(account.accessToken);

      const isVerified = authResult.accounts.some(acc =>
        acc.account_id === account.accountId && acc.balances
      );

      // Update verification status
      account.isVerified = isVerified;
      await this.securelyStoreBankAccount(userId, account);

      return { success: true, isVerified };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify bank account'
      };
    }
  }

  async getAccountBalance(userId: string, accountId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      const account = this.linkedAccounts.get(accountId);
      if (!account) {
        return { success: false, error: 'Bank account not found' };
      }

      const balanceResult = await this.plaidService.getBalance(account.accessToken);
      const accountBalance = balanceResult.accounts.find(acc => acc.account_id === account.accountId);

      if (!accountBalance?.balances?.available) {
        return { success: false, error: 'Balance information not available' };
      }

      return {
        success: true,
        balance: accountBalance.balances.available
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account balance'
      };
    }
  }

  private async securelyStoreBankAccount(userId: string, account: BankAccount): Promise<void> {
    const encryptedAccount = await mockEncryption.encryptObject(account, `user_${userId}_key`);
    await mockSecureStorage.store(`bank_account_${userId}_${account.id}`, JSON.stringify(encryptedAccount));
  }

  private async loadUserBankAccounts(userId: string): Promise<BankAccount[]> {
    const accounts: BankAccount[] = [];

    // In a real implementation, this would query stored accounts
    // For testing, return accounts from memory
    for (const account of this.linkedAccounts.values()) {
      accounts.push(account);
    }

    return accounts;
  }

  // Test helper methods
  clearLinkedAccounts(): void {
    this.linkedAccounts.clear();
    this.linkingInProgress = false;
  }
}

describe('Bank Account Linking Integration Tests', () => {
  let bankLinkingService: BankAccountLinkingService;
  let paymentService: PaymentService;

  const mockUserId = 'user_123';
  const mockLinkResult: PlaidLinkResult = {
    publicToken: 'public-sandbox-test-token',
    metadata: {
      institution: {
        name: 'Chase Bank',
        institution_id: 'ins_109508'
      },
      accounts: [
        {
          id: 'account_123',
          name: 'Chase Checking',
          type: 'depository',
          subtype: 'checking',
          mask: '1234'
        }
      ],
      link_session_id: 'session_123'
    }
  };

  beforeEach(() => {
    bankLinkingService = new BankAccountLinkingService();
    paymentService = new PaymentService({} as any, {} as any, {} as any);

    // Reset mocks
    jest.clearAllMocks();
    bankLinkingService.clearLinkedAccounts();

    // Setup default mock responses
    mockPlaidLink.create.mockResolvedValue({ linkToken: 'link-sandbox-test-token' });
    mockEncryption.encryptObject.mockResolvedValue({ ciphertext: 'encrypted_data' });
    mockEncryption.decryptObject.mockResolvedValue({});
    mockSecureStorage.store.mockResolvedValue(true);
    mockSecureStorage.retrieve.mockResolvedValue('{"ciphertext": "encrypted_data"}');

    // Mock Plaid service methods
    PlaidService.getInstance = jest.fn().mockReturnValue({
      createLinkToken: jest.fn().mockResolvedValue('link-sandbox-test-token'),
      exchangePublicToken: jest.fn().mockResolvedValue({
        access_token: 'access-sandbox-test-token',
        item_id: 'item_123'
      }),
      getAccounts: jest.fn().mockResolvedValue({
        accounts: [
          {
            account_id: 'account_123',
            balances: {
              available: 1000.00,
              current: 1000.00,
              iso_currency_code: 'USD'
            },
            mask: '1234',
            name: 'Chase Checking',
            official_name: 'Chase Bank Checking Account',
            type: 'depository',
            subtype: 'checking'
          }
        ]
      }),
      getAuth: jest.fn().mockResolvedValue({
        accounts: [
          {
            account_id: 'account_123',
            balances: {
              available: 1000.00,
              current: 1000.00,
              iso_currency_code: 'USD'
            }
          }
        ]
      }),
      getBalance: jest.fn().mockResolvedValue({
        accounts: [
          {
            account_id: 'account_123',
            balances: {
              available: 1000.00,
              current: 1000.00,
              iso_currency_code: 'USD'
            }
          }
        ]
      })
    });
  });

  describe('Bank Account Linking Flow', () => {
    it('should initiate bank linking successfully', async () => {
      // Act
      const result = await bankLinkingService.initiateBankLinking(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.linkToken).toBe('link-sandbox-test-token');
      expect(result.error).toBeUndefined();
    });

    it('should prevent concurrent linking attempts', async () => {
      // Arrange - Start first linking attempt
      await bankLinkingService.initiateBankLinking(mockUserId);

      // Act - Try second linking attempt
      const result = await bankLinkingService.initiateBankLinking(mockUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bank linking already in progress');
    });

    it('should complete bank linking successfully', async () => {
      // Arrange - First initiate linking
      await bankLinkingService.initiateBankLinking(mockUserId);

      // Act - Complete linking
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts![0].accountName).toBe('Chase Checking');
      expect(result.accounts![0].institutionName).toBe('Chase Bank');
      expect(result.accounts![0].mask).toBe('1234');
      expect(result.accounts![0].isVerified).toBe(true);
      expect(result.accounts![0].isActive).toBe(true);
    });

    it('should handle linking completion without initiation', async () => {
      // Act - Try to complete linking without initiation
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No linking process in progress');
    });

    it('should securely store linked accounts', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);

      // Act
      await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(mockEncryption.encryptObject).toHaveBeenCalledWith(
        expect.objectContaining({
          accountName: 'Chase Checking',
          institutionName: 'Chase Bank'
        }),
        'user_user_123_key'
      );
      expect(mockSecureStorage.store).toHaveBeenCalledWith(
        expect.stringMatching(/^bank_account_user_123_/),
        expect.any(String)
      );
    });
  });

  describe('Account Management', () => {
    beforeEach(async () => {
      // Link an account before each test
      await bankLinkingService.initiateBankLinking(mockUserId);
      await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);
    });

    it('should retrieve user bank accounts', async () => {
      // Act
      const result = await bankLinkingService.getUserBankAccounts(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts![0].institutionName).toBe('Chase Bank');
    });

    it('should unlink bank account successfully', async () => {
      // Arrange
      const accountsResult = await bankLinkingService.getUserBankAccounts(mockUserId);
      const accountId = accountsResult.accounts![0].id;

      // Act
      const result = await bankLinkingService.unlinkBankAccount(mockUserId, accountId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSecureStorage.delete).toHaveBeenCalledWith(
        `bank_account_${mockUserId}_${accountId}`
      );

      // Verify account is removed
      const updatedAccounts = await bankLinkingService.getUserBankAccounts(mockUserId);
      expect(updatedAccounts.accounts).toHaveLength(0);
    });

    it('should verify bank account successfully', async () => {
      // Arrange
      const accountsResult = await bankLinkingService.getUserBankAccounts(mockUserId);
      const accountId = accountsResult.accounts![0].id;

      // Act
      const result = await bankLinkingService.verifyBankAccount(mockUserId, accountId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.isVerified).toBe(true);
    });

    it('should handle verification of non-existent account', async () => {
      // Act
      const result = await bankLinkingService.verifyBankAccount(mockUserId, 'non_existent_account');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bank account not found');
    });

    it('should get account balance successfully', async () => {
      // Arrange
      const accountsResult = await bankLinkingService.getUserBankAccounts(mockUserId);
      const accountId = accountsResult.accounts![0].id;

      // Act
      const result = await bankLinkingService.getAccountBalance(mockUserId, accountId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.balance).toBe(1000.00);
    });

    it('should handle balance request for non-existent account', async () => {
      // Act
      const result = await bankLinkingService.getAccountBalance(mockUserId, 'non_existent_account');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bank account not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle Plaid API errors during linking initiation', async () => {
      // Arrange
      PlaidService.getInstance = jest.fn().mockReturnValue({
        createLinkToken: jest.fn().mockRejectedValue(new Error('Plaid API error'))
      });

      // Act
      const result = await bankLinkingService.initiateBankLinking(mockUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Plaid API error');
    });

    it('should handle token exchange failures', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);

      PlaidService.getInstance = jest.fn().mockReturnValue({
        exchangePublicToken: jest.fn().mockResolvedValue({
          access_token: null,
          error: 'Invalid public token'
        })
      });

      // Act
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to exchange public token');
    });

    it('should handle account information retrieval failures', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);

      const mockPlaidService = {
        exchangePublicToken: jest.fn().mockResolvedValue({
          access_token: 'access-token',
          item_id: 'item_123'
        }),
        getAccounts: jest.fn().mockRejectedValue(new Error('Failed to retrieve accounts'))
      };

      PlaidService.getInstance = jest.fn().mockReturnValue(mockPlaidService);

      // Act
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve accounts');
    });

    it('should handle storage encryption failures', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);
      mockEncryption.encryptObject.mockRejectedValue(new Error('Encryption failed'));

      // Act
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Encryption failed');
    });

    it('should handle secure storage failures', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);
      mockSecureStorage.store.mockRejectedValue(new Error('Storage failed'));

      // Act
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage failed');
    });
  });

  describe('Multiple Account Support', () => {
    const mockMultiAccountLinkResult: PlaidLinkResult = {
      publicToken: 'public-sandbox-multi-token',
      metadata: {
        institution: {
          name: 'Bank of America',
          institution_id: 'ins_109519'
        },
        accounts: [
          {
            id: 'account_checking',
            name: 'BoA Checking',
            type: 'depository',
            subtype: 'checking',
            mask: '5678'
          },
          {
            id: 'account_savings',
            name: 'BoA Savings',
            type: 'depository',
            subtype: 'savings',
            mask: '9012'
          }
        ],
        link_session_id: 'session_multi'
      }
    };

    it('should handle linking multiple accounts from same institution', async () => {
      // Arrange
      PlaidService.getInstance = jest.fn().mockReturnValue({
        createLinkToken: jest.fn().mockResolvedValue('link-token'),
        exchangePublicToken: jest.fn().mockResolvedValue({
          access_token: 'access-token-multi',
          item_id: 'item_multi'
        }),
        getAccounts: jest.fn().mockResolvedValue({
          accounts: [
            {
              account_id: 'account_checking',
              name: 'BoA Checking',
              type: 'depository',
              subtype: 'checking',
              mask: '5678'
            },
            {
              account_id: 'account_savings',
              name: 'BoA Savings',
              type: 'depository',
              subtype: 'savings',
              mask: '9012'
            }
          ]
        })
      });

      await bankLinkingService.initiateBankLinking(mockUserId);

      // Act
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockMultiAccountLinkResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts![0].accountName).toBe('BoA Checking');
      expect(result.accounts![1].accountName).toBe('BoA Savings');
      expect(result.accounts![0].institutionName).toBe('Bank of America');
      expect(result.accounts![1].institutionName).toBe('Bank of America');
    });

    it('should handle concurrent linking of different institutions', async () => {
      // This test verifies that the service can handle multiple users
      // linking different institutions simultaneously
      const user1Id = 'user_1';
      const user2Id = 'user_2';

      const service1 = new BankAccountLinkingService();
      const service2 = new BankAccountLinkingService();

      // Act - Initiate linking for both users concurrently
      const [initResult1, initResult2] = await Promise.all([
        service1.initiateBankLinking(user1Id),
        service2.initiateBankLinking(user2Id)
      ]);

      // Assert
      expect(initResult1.success).toBe(true);
      expect(initResult2.success).toBe(true);
      expect(initResult1.linkToken).toBeTruthy();
      expect(initResult2.linkToken).toBeTruthy();

      // Complete linking for both users
      const [completeResult1, completeResult2] = await Promise.all([
        service1.completeBankLinking(user1Id, mockLinkResult),
        service2.completeBankLinking(user2Id, mockMultiAccountLinkResult)
      ]);

      // Assert
      expect(completeResult1.success).toBe(true);
      expect(completeResult2.success).toBe(true);
      expect(completeResult1.accounts).toHaveLength(1);
      expect(completeResult2.accounts).toHaveLength(2);
    });
  });

  describe('Security and Data Protection', () => {
    it('should encrypt sensitive data before storage', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);

      // Act
      await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert - Verify encryption was called with sensitive data
      expect(mockEncryption.encryptObject).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'access-sandbox-test-token',
          accountId: 'account_123'
        }),
        expect.any(String)
      );
    });

    it('should not expose access tokens in error messages', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);

      const mockPlaidService = {
        exchangePublicToken: jest.fn().mockResolvedValue({
          access_token: 'secret-access-token',
          item_id: 'item_123'
        }),
        getAccounts: jest.fn().mockRejectedValue(new Error('API error with access_token=secret-access-token'))
      };

      PlaidService.getInstance = jest.fn().mockReturnValue(mockPlaidService);

      // Act
      const result = await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      // Assert
      expect(result.success).toBe(false);
      // Error message should not contain the actual access token
      expect(result.error).not.toContain('secret-access-token');
    });

    it('should validate user permissions before account operations', async () => {
      // Arrange
      await bankLinkingService.initiateBankLinking(mockUserId);
      await bankLinkingService.completeBankLinking(mockUserId, mockLinkResult);

      const accountsResult = await bankLinkingService.getUserBankAccounts(mockUserId);
      const accountId = accountsResult.accounts![0].id;

      // Act - Try to access account with different user
      const differentUserId = 'different_user';
      const result = await bankLinkingService.verifyBankAccount(differentUserId, accountId);

      // Assert - Should fail because account belongs to different user
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bank account not found');
    });
  });
});