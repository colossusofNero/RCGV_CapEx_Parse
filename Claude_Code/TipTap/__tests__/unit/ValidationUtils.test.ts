import { ValidationUtils } from '@/shared/utils/ValidationUtils';

describe('ValidationUtils', () => {
  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      const result = ValidationUtils.validateAmount(25.50);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject zero amount', () => {
      const result = ValidationUtils.validateAmount(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Amount must be at least');
    });

    it('should reject negative amounts', () => {
      const result = ValidationUtils.validateAmount(-10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Amount must be at least');
    });

    it('should reject amounts exceeding maximum', () => {
      const result = ValidationUtils.validateAmount(1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Amount cannot exceed');
    });

    it('should reject non-numeric values', () => {
      const result = ValidationUtils.validateAmount(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount must be a valid number');
    });

    it('should validate decimal places', () => {
      const validResult = ValidationUtils.validateAmount(25.99);
      expect(validResult.isValid).toBe(true);

      const invalidResult = ValidationUtils.validateAmount(25.999);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('decimal places');
    });

    it('should accept minimum valid amount', () => {
      const result = ValidationUtils.validateAmount(0.01);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTipPercentage', () => {
    it('should validate positive percentages', () => {
      const result = ValidationUtils.validateTipPercentage(18);
      expect(result.isValid).toBe(true);
    });

    it('should accept zero percentage', () => {
      const result = ValidationUtils.validateTipPercentage(0);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative percentages', () => {
      const result = ValidationUtils.validateTipPercentage(-5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Tip percentage cannot be negative');
    });

    it('should reject percentages exceeding maximum', () => {
      const result = ValidationUtils.validateTipPercentage(150);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Tip percentage cannot exceed');
    });

    it('should reject non-numeric values', () => {
      const result = ValidationUtils.validateTipPercentage(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Tip percentage must be a valid number');
    });
  });

  describe('validateCurrency', () => {
    it('should validate proper currency codes', () => {
      expect(ValidationUtils.validateCurrency('USD').isValid).toBe(true);
      expect(ValidationUtils.validateCurrency('EUR').isValid).toBe(true);
      expect(ValidationUtils.validateCurrency('GBP').isValid).toBe(true);
    });

    it('should reject invalid lengths', () => {
      expect(ValidationUtils.validateCurrency('US').isValid).toBe(false);
      expect(ValidationUtils.validateCurrency('USDD').isValid).toBe(false);
    });

    it('should reject lowercase', () => {
      const result = ValidationUtils.validateCurrency('usd');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('uppercase format');
    });

    it('should reject non-string values', () => {
      const result = ValidationUtils.validateCurrency(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Currency must be a string');
    });

    it('should reject special characters', () => {
      const result = ValidationUtils.validateCurrency('U$D');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('uppercase format');
    });
  });

  describe('validateTransactionId', () => {
    it('should validate proper transaction IDs', () => {
      const result = ValidationUtils.validateTransactionId('txn_1234567890_abc123');
      expect(result.isValid).toBe(true);
    });

    it('should reject short transaction IDs', () => {
      const result = ValidationUtils.validateTransactionId('short');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should reject long transaction IDs', () => {
      const longId = 'a'.repeat(51);
      const result = ValidationUtils.validateTransactionId(longId);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should reject invalid characters', () => {
      const result = ValidationUtils.validateTransactionId('txn_123@456');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should accept valid characters', () => {
      const result = ValidationUtils.validateTransactionId('txn_123-456_abc');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should validate proper email addresses', () => {
      expect(ValidationUtils.validateEmail('user@example.com').isValid).toBe(true);
      expect(ValidationUtils.validateEmail('test.user+tag@domain.co.uk').isValid).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(ValidationUtils.validateEmail('invalid-email').isValid).toBe(false);
      expect(ValidationUtils.validateEmail('@domain.com').isValid).toBe(false);
      expect(ValidationUtils.validateEmail('user@').isValid).toBe(false);
      expect(ValidationUtils.validateEmail('user@domain').isValid).toBe(false);
    });

    it('should reject very long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = ValidationUtils.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject non-string values', () => {
      const result = ValidationUtils.validateEmail(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email must be a string');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate proper phone numbers', () => {
      expect(ValidationUtils.validatePhoneNumber('1234567890').isValid).toBe(true);
      expect(ValidationUtils.validatePhoneNumber('+1 (555) 123-4567').isValid).toBe(true);
      expect(ValidationUtils.validatePhoneNumber('555.123.4567').isValid).toBe(true);
    });

    it('should reject short phone numbers', () => {
      const result = ValidationUtils.validatePhoneNumber('12345');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 10 digits');
    });

    it('should reject very long phone numbers', () => {
      const result = ValidationUtils.validatePhoneNumber('1234567890123456');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed 15 digits');
    });

    it('should handle international formats', () => {
      expect(ValidationUtils.validatePhoneNumber('+44 20 7946 0958').isValid).toBe(true);
    });
  });

  describe('validateMerchantId', () => {
    it('should validate proper merchant IDs', () => {
      expect(ValidationUtils.validateMerchantId('merchant_123').isValid).toBe(true);
      expect(ValidationUtils.validateMerchantId('test-merchant').isValid).toBe(true);
    });

    it('should reject empty merchant IDs', () => {
      const result = ValidationUtils.validateMerchantId('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Merchant ID is required');
    });

    it('should reject very long merchant IDs', () => {
      const longId = 'a'.repeat(101);
      const result = ValidationUtils.validateMerchantId(longId);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject invalid characters', () => {
      const result = ValidationUtils.validateMerchantId('merchant@123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });

  describe('validateTransactionLimits', () => {
    it('should validate proper limits', () => {
      const limits = {
        dailyLimit: 500,
        monthlyLimit: 2000,
        perTransactionLimit: 100
      };
      const result = ValidationUtils.validateTransactionLimits(limits);
      expect(result.isValid).toBe(true);
    });

    it('should reject when per-transaction limit exceeds daily limit', () => {
      const limits = {
        dailyLimit: 100,
        monthlyLimit: 2000,
        perTransactionLimit: 200
      };
      const result = ValidationUtils.validateTransactionLimits(limits);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Per transaction limit cannot exceed daily limit');
    });

    it('should reject when daily limit exceeds monthly limit', () => {
      const limits = {
        dailyLimit: 2000,
        monthlyLimit: 1000,
        perTransactionLimit: 100
      };
      const result = ValidationUtils.validateTransactionLimits(limits);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Daily limit cannot exceed monthly limit');
    });

    it('should validate individual limit amounts', () => {
      const limits = {
        dailyLimit: -100,
        monthlyLimit: 2000,
        perTransactionLimit: 50
      };
      const result = ValidationUtils.validateTransactionLimits(limits);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Daily limit');
    });
  });

  describe('validateCardNumber', () => {
    it('should validate proper card numbers', () => {
      // Visa test card
      expect(ValidationUtils.validateCardNumber('4111111111111111').isValid).toBe(true);
      // Mastercard test card
      expect(ValidationUtils.validateCardNumber('5555555555554444').isValid).toBe(true);
    });

    it('should handle formatted card numbers', () => {
      expect(ValidationUtils.validateCardNumber('4111 1111 1111 1111').isValid).toBe(true);
      expect(ValidationUtils.validateCardNumber('4111-1111-1111-1111').isValid).toBe(true);
    });

    it('should reject invalid card numbers (Luhn check)', () => {
      const result = ValidationUtils.validateCardNumber('4111111111111112');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid card number');
    });

    it('should reject non-numeric characters', () => {
      const result = ValidationUtils.validateCardNumber('411111111111111a');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('digits');
    });

    it('should reject short card numbers', () => {
      const result = ValidationUtils.validateCardNumber('41111111');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('between 13 and 19 digits');
    });

    it('should reject long card numbers', () => {
      const result = ValidationUtils.validateCardNumber('41111111111111111111');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('between 13 and 19 digits');
    });
  });

  describe('validateExpiryDate', () => {
    it('should validate proper expiry dates', () => {
      // Future date
      const result = ValidationUtils.validateExpiryDate('12/30');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(ValidationUtils.validateExpiryDate('1/30').isValid).toBe(false);
      expect(ValidationUtils.validateExpiryDate('13/30').isValid).toBe(false);
      expect(ValidationUtils.validateExpiryDate('12-30').isValid).toBe(false);
    });

    it('should reject expired cards', () => {
      const result = ValidationUtils.validateExpiryDate('01/20');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Card has expired');
    });

    it('should reject dates too far in future', () => {
      const result = ValidationUtils.validateExpiryDate('12/40');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too far in the future');
    });

    it('should handle current month/year edge case', () => {
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = (now.getFullYear() % 100).toString().padStart(2, '0');

      const result = ValidationUtils.validateExpiryDate(`${currentMonth}/${currentYear}`);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCVV', () => {
    it('should validate 3-digit CVV', () => {
      expect(ValidationUtils.validateCVV('123').isValid).toBe(true);
    });

    it('should validate 4-digit CVV', () => {
      expect(ValidationUtils.validateCVV('1234').isValid).toBe(true);
    });

    it('should reject invalid lengths', () => {
      expect(ValidationUtils.validateCVV('12').isValid).toBe(false);
      expect(ValidationUtils.validateCVV('12345').isValid).toBe(false);
    });

    it('should reject non-numeric CVV', () => {
      const result = ValidationUtils.validateCVV('12a');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CVV must be 3 or 4 digits');
    });
  });

  describe('validateBankAccountNumber', () => {
    it('should validate proper account numbers', () => {
      expect(ValidationUtils.validateBankAccountNumber('1234567890').isValid).toBe(true);
    });

    it('should handle formatted account numbers', () => {
      expect(ValidationUtils.validateBankAccountNumber('123-456-7890').isValid).toBe(true);
    });

    it('should reject short account numbers', () => {
      const result = ValidationUtils.validateBankAccountNumber('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should reject long account numbers', () => {
      const result = ValidationUtils.validateBankAccountNumber('123456789012345678');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('validateRoutingNumber', () => {
    it('should validate proper routing numbers', () => {
      // Valid ABA routing number
      expect(ValidationUtils.validateRoutingNumber('021000021').isValid).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(ValidationUtils.validateRoutingNumber('12345678').isValid).toBe(false);
      expect(ValidationUtils.validateRoutingNumber('1234567890').isValid).toBe(false);
    });

    it('should reject invalid checksum', () => {
      const result = ValidationUtils.validateRoutingNumber('123456789');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid routing number');
    });

    it('should handle formatted routing numbers', () => {
      expect(ValidationUtils.validateRoutingNumber('021-000-021').isValid).toBe(true);
    });
  });

  describe('validatePaymentRequest', () => {
    it('should validate complete payment request', () => {
      const request = {
        amount: 25.50,
        currency: 'USD',
        merchantId: 'merchant_123',
        tipPercentage: 18
      };

      const result = ValidationUtils.validatePaymentRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const request = {
        amount: -10,
        currency: 'INVALID',
        merchantId: '',
        tipPercentage: -5
      };

      const result = ValidationUtils.validatePaymentRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate without optional fields', () => {
      const request = {
        amount: 50.00,
        currency: 'USD',
        merchantId: 'merchant_123'
      };

      const result = ValidationUtils.validatePaymentRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined values gracefully', () => {
      expect(ValidationUtils.validateAmount(null as any).isValid).toBe(false);
      expect(ValidationUtils.validateCurrency(undefined as any).isValid).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(ValidationUtils.validateCurrency('').isValid).toBe(false);
      expect(ValidationUtils.validateMerchantId('').isValid).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(ValidationUtils.validateCurrency('   ').isValid).toBe(false);
    });
  });
});