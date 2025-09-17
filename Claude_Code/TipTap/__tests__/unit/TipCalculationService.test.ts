import { TipCalculationService, TipCalculationOptions, TipPreset } from '@/application/services/TipCalculationService';
import { TipCalculation } from '@/domain/entities/Transaction';

describe('TipCalculationService', () => {
  let tipCalculationService: TipCalculationService;

  beforeEach(() => {
    tipCalculationService = new TipCalculationService();
  });

  describe('calculateTip', () => {
    it('should calculate tip correctly with percentage', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: 'USD'
      };

      // Act
      const result = tipCalculationService.calculateTip(options);

      // Assert
      expect(result.baseAmount).toBe(100.00);
      expect(result.tipPercentage).toBe(18);
      expect(result.tipAmount).toBe(18.00);
      expect(result.totalAmount).toBe(118.00);
      expect(result.currency).toBe('USD');
    });

    it('should calculate tip with custom tip amount', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: 'USD',
        customTipAmount: 25.00
      };

      // Act
      const result = tipCalculationService.calculateTip(options);

      // Assert
      expect(result.baseAmount).toBe(100.00);
      expect(result.tipPercentage).toBe(18);
      expect(result.tipAmount).toBe(25.00);
      expect(result.totalAmount).toBe(125.00);
      expect(result.currency).toBe('USD');
    });

    it('should handle rounding modes correctly', () => {
      // Arrange
      const baseOptions: TipCalculationOptions = {
        baseAmount: 33.33,
        tipPercentage: 15,
        currency: 'USD'
      };

      // Act
      const roundUp = tipCalculationService.calculateTip({
        ...baseOptions,
        roundingMode: 'up'
      });
      const roundDown = tipCalculationService.calculateTip({
        ...baseOptions,
        roundingMode: 'down'
      });
      const roundNearest = tipCalculationService.calculateTip({
        ...baseOptions,
        roundingMode: 'nearest'
      });

      // Assert
      expect(roundUp.tipAmount).toBe(5.00); // Math.ceil(4.9995) = 5.00
      expect(roundDown.tipAmount).toBe(4.99); // Math.floor(4.9995) = 4.99
      expect(roundNearest.tipAmount).toBe(5.00); // Math.round(4.9995) = 5.00
    });

    it('should use nearest rounding by default', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 33.33,
        tipPercentage: 15,
        currency: 'USD'
      };

      // Act
      const result = tipCalculationService.calculateTip(options);

      // Assert
      expect(result.tipAmount).toBe(5.00); // Default rounding should be nearest
    });

    it('should validate base amount > 0', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 0,
        tipPercentage: 18,
        currency: 'USD'
      };

      // Act & Assert
      expect(() => tipCalculationService.calculateTip(options))
        .toThrow('Base amount must be greater than 0');
    });

    it('should validate negative base amount', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: -50.00,
        tipPercentage: 18,
        currency: 'USD'
      };

      // Act & Assert
      expect(() => tipCalculationService.calculateTip(options))
        .toThrow('Base amount must be greater than 0');
    });

    it('should validate tip percentage is not negative', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: -5,
        currency: 'USD'
      };

      // Act & Assert
      expect(() => tipCalculationService.calculateTip(options))
        .toThrow('Tip percentage cannot be negative');
    });

    it('should allow zero tip percentage', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 0,
        currency: 'USD'
      };

      // Act
      const result = tipCalculationService.calculateTip(options);

      // Assert
      expect(result.tipAmount).toBe(0);
      expect(result.totalAmount).toBe(100.00);
    });

    it('should validate currency format', () => {
      // Arrange
      const invalidCurrencyOptions: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: 'INVALID'
      };

      const emptyCurrencyOptions: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: ''
      };

      const shortCurrencyOptions: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: 'US'
      };

      // Act & Assert
      expect(() => tipCalculationService.calculateTip(invalidCurrencyOptions))
        .toThrow('Currency must be a valid 3-letter code');
      expect(() => tipCalculationService.calculateTip(emptyCurrencyOptions))
        .toThrow('Currency must be a valid 3-letter code');
      expect(() => tipCalculationService.calculateTip(shortCurrencyOptions))
        .toThrow('Currency must be a valid 3-letter code');
    });

    it('should validate custom tip amount is not negative', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: 'USD',
        customTipAmount: -10.00
      };

      // Act & Assert
      expect(() => tipCalculationService.calculateTip(options))
        .toThrow('Custom tip amount cannot be negative');
    });

    it('should allow zero custom tip amount', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: 'USD',
        customTipAmount: 0
      };

      // Act
      const result = tipCalculationService.calculateTip(options);

      // Assert
      expect(result.tipAmount).toBe(0);
      expect(result.totalAmount).toBe(100.00);
    });

    it('should handle very large amounts', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 999999.99,
        tipPercentage: 20,
        currency: 'USD'
      };

      // Act
      const result = tipCalculationService.calculateTip(options);

      // Assert
      expect(result.tipAmount).toBe(200000.00);
      expect(result.totalAmount).toBe(1199999.99);
    });

    it('should handle very small amounts', () => {
      // Arrange
      const options: TipCalculationOptions = {
        baseAmount: 0.01,
        tipPercentage: 15,
        currency: 'USD'
      };

      // Act
      const result = tipCalculationService.calculateTip(options);

      // Assert
      expect(result.baseAmount).toBe(0.01);
      expect(result.tipAmount).toBe(0.00); // Rounds to 0
      expect(result.totalAmount).toBe(0.01);
    });
  });

  describe('calculateTipFromTotal', () => {
    it('should calculate base and tip amounts from total', () => {
      // Act
      const result = tipCalculationService.calculateTipFromTotal(118.00, 18, 'USD');

      // Assert
      expect(result.totalAmount).toBe(118.00);
      expect(result.tipPercentage).toBe(18);
      expect(result.baseAmount).toBe(100.00);
      expect(result.tipAmount).toBe(18.00);
      expect(result.currency).toBe('USD');
    });

    it('should validate total amount > 0', () => {
      // Act & Assert
      expect(() => tipCalculationService.calculateTipFromTotal(0, 18, 'USD'))
        .toThrow('Total amount must be greater than 0');
    });

    it('should validate negative total amount', () => {
      // Act & Assert
      expect(() => tipCalculationService.calculateTipFromTotal(-100, 18, 'USD'))
        .toThrow('Total amount must be greater than 0');
    });

    it('should validate tip percentage is not negative', () => {
      // Act & Assert
      expect(() => tipCalculationService.calculateTipFromTotal(118.00, -5, 'USD'))
        .toThrow('Tip percentage cannot be negative');
    });

    it('should handle zero tip percentage', () => {
      // Act
      const result = tipCalculationService.calculateTipFromTotal(100.00, 0, 'USD');

      // Assert
      expect(result.baseAmount).toBe(100.00);
      expect(result.tipAmount).toBe(0.00);
      expect(result.totalAmount).toBe(100.00);
    });

    it('should handle fractional results correctly', () => {
      // Act
      const result = tipCalculationService.calculateTipFromTotal(111.11, 11, 'USD');

      // Assert
      expect(result.totalAmount).toBe(111.11);
      expect(result.tipPercentage).toBe(11);
      // 111.11 / 1.11 = 100.099099... -> rounds to 100.10
      expect(result.baseAmount).toBe(100.10);
      expect(result.tipAmount).toBe(11.01);
    });
  });

  describe('validateTipAmount', () => {
    it('should validate positive amounts', () => {
      // Act & Assert
      expect(tipCalculationService.validateTipAmount(10.00)).toBe(true);
      expect(tipCalculationService.validateTipAmount(0.01)).toBe(true);
    });

    it('should accept zero amount', () => {
      // Act & Assert
      expect(tipCalculationService.validateTipAmount(0)).toBe(true);
    });

    it('should reject negative amounts', () => {
      // Act & Assert
      expect(tipCalculationService.validateTipAmount(-5.00)).toBe(false);
      expect(tipCalculationService.validateTipAmount(-0.01)).toBe(false);
    });

    it('should validate against maximum amount', () => {
      // Act & Assert
      expect(tipCalculationService.validateTipAmount(50.00, 100.00)).toBe(true);
      expect(tipCalculationService.validateTipAmount(100.00, 100.00)).toBe(true);
      expect(tipCalculationService.validateTipAmount(150.00, 100.00)).toBe(false);
    });

    it('should ignore max amount if not provided', () => {
      // Act & Assert
      expect(tipCalculationService.validateTipAmount(999999.99)).toBe(true);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      // Act & Assert
      expect(tipCalculationService.formatCurrency(123.45, 'USD')).toBe('$123.45');
      expect(tipCalculationService.formatCurrency(0, 'USD')).toBe('$0.00');
      expect(tipCalculationService.formatCurrency(1.5, 'USD')).toBe('$1.50');
    });

    it('should handle different currencies', () => {
      // Act & Assert
      expect(tipCalculationService.formatCurrency(123.45, 'EUR')).toContain('123.45');
      expect(tipCalculationService.formatCurrency(123.45, 'GBP')).toContain('123.45');
    });

    it('should handle invalid currency codes', () => {
      // Act
      const result = tipCalculationService.formatCurrency(123.45, 'INVALID');

      // Assert - Should fallback to basic format
      expect(result).toBe('INVALID 123.45');
    });

    it('should format negative amounts', () => {
      // Act
      const result = tipCalculationService.formatCurrency(-123.45, 'USD');

      // Assert
      expect(result).toBe('-$123.45');
    });

    it('should handle large amounts', () => {
      // Act
      const result = tipCalculationService.formatCurrency(1234567.89, 'USD');

      // Assert
      expect(result).toBe('$1,234,567.89');
    });

    it('should handle very small amounts', () => {
      // Act
      const result = tipCalculationService.formatCurrency(0.01, 'USD');

      // Assert
      expect(result).toBe('$0.01');
    });

    it('should always show 2 decimal places', () => {
      // Act & Assert
      expect(tipCalculationService.formatCurrency(5, 'USD')).toBe('$5.00');
      expect(tipCalculationService.formatCurrency(5.1, 'USD')).toBe('$5.10');
      expect(tipCalculationService.formatCurrency(5.123, 'USD')).toBe('$5.12');
    });
  });
});