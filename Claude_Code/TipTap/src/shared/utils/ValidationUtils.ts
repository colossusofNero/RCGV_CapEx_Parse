import { VALIDATION_RULES } from '@/shared/constants/AppConstants';

export class ValidationUtils {
  /**
   * Validates payment amount
   */
  static validateAmount(amount: number): { isValid: boolean; error?: string } {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (amount < VALIDATION_RULES.amount.min) {
      return { isValid: false, error: `Amount must be at least $${VALIDATION_RULES.amount.min}` };
    }

    if (amount > VALIDATION_RULES.amount.max) {
      return { isValid: false, error: `Amount cannot exceed $${VALIDATION_RULES.amount.max}` };
    }

    // Check decimal places
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > VALIDATION_RULES.amount.decimalPlaces) {
      return { isValid: false, error: `Amount cannot have more than ${VALIDATION_RULES.amount.decimalPlaces} decimal places` };
    }

    return { isValid: true };
  }

  /**
   * Validates tip percentage
   */
  static validateTipPercentage(percentage: number): { isValid: boolean; error?: string } {
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      return { isValid: false, error: 'Tip percentage must be a valid number' };
    }

    if (percentage < VALIDATION_RULES.tipPercentage.min) {
      return { isValid: false, error: `Tip percentage cannot be negative` };
    }

    if (percentage > VALIDATION_RULES.tipPercentage.max) {
      return { isValid: false, error: `Tip percentage cannot exceed ${VALIDATION_RULES.tipPercentage.max}%` };
    }

    return { isValid: true };
  }

  /**
   * Validates currency code
   */
  static validateCurrency(currency: string): { isValid: boolean; error?: string } {
    if (typeof currency !== 'string') {
      return { isValid: false, error: 'Currency must be a string' };
    }

    if (currency.length !== VALIDATION_RULES.currency.length) {
      return { isValid: false, error: `Currency must be ${VALIDATION_RULES.currency.length} characters long` };
    }

    if (!VALIDATION_RULES.currency.format.test(currency)) {
      return { isValid: false, error: 'Currency must be in uppercase format (e.g., USD)' };
    }

    return { isValid: true };
  }

  /**
   * Validates transaction ID format
   */
  static validateTransactionId(transactionId: string): { isValid: boolean; error?: string } {
    if (typeof transactionId !== 'string') {
      return { isValid: false, error: 'Transaction ID must be a string' };
    }

    if (transactionId.length < VALIDATION_RULES.transactionId.minLength) {
      return { isValid: false, error: `Transaction ID must be at least ${VALIDATION_RULES.transactionId.minLength} characters long` };
    }

    if (transactionId.length > VALIDATION_RULES.transactionId.maxLength) {
      return { isValid: false, error: `Transaction ID cannot exceed ${VALIDATION_RULES.transactionId.maxLength} characters` };
    }

    if (!VALIDATION_RULES.transactionId.format.test(transactionId)) {
      return { isValid: false, error: 'Transaction ID contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Validates email format
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (typeof email !== 'string') {
      return { isValid: false, error: 'Email must be a string' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email address is too long' };
    }

    return { isValid: true };
  }

  /**
   * Validates phone number format
   */
  static validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    if (typeof phone !== 'string') {
      return { isValid: false, error: 'Phone number must be a string' };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
      return { isValid: false, error: 'Phone number must have at least 10 digits' };
    }

    if (digitsOnly.length > 15) {
      return { isValid: false, error: 'Phone number cannot exceed 15 digits' };
    }

    return { isValid: true };
  }

  /**
   * Validates merchant ID format
   */
  static validateMerchantId(merchantId: string): { isValid: boolean; error?: string } {
    if (typeof merchantId !== 'string') {
      return { isValid: false, error: 'Merchant ID must be a string' };
    }

    if (merchantId.length === 0) {
      return { isValid: false, error: 'Merchant ID is required' };
    }

    if (merchantId.length > 100) {
      return { isValid: false, error: 'Merchant ID is too long' };
    }

    // Basic alphanumeric validation
    if (!/^[a-zA-Z0-9_-]+$/.test(merchantId)) {
      return { isValid: false, error: 'Merchant ID contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Validates transaction limits
   */
  static validateTransactionLimits(limits: {
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
  }): { isValid: boolean; error?: string } {
    const { dailyLimit, monthlyLimit, perTransactionLimit } = limits;

    // Validate individual amounts
    const dailyValidation = this.validateAmount(dailyLimit);
    if (!dailyValidation.isValid) {
      return { isValid: false, error: `Daily limit: ${dailyValidation.error}` };
    }

    const monthlyValidation = this.validateAmount(monthlyLimit);
    if (!monthlyValidation.isValid) {
      return { isValid: false, error: `Monthly limit: ${monthlyValidation.error}` };
    }

    const perTransactionValidation = this.validateAmount(perTransactionLimit);
    if (!perTransactionValidation.isValid) {
      return { isValid: false, error: `Per transaction limit: ${perTransactionValidation.error}` };
    }

    // Validate limit relationships
    if (perTransactionLimit > dailyLimit) {
      return { isValid: false, error: 'Per transaction limit cannot exceed daily limit' };
    }

    if (dailyLimit > monthlyLimit) {
      return { isValid: false, error: 'Daily limit cannot exceed monthly limit' };
    }

    return { isValid: true };
  }

  /**
   * Validates card number format (Luhn algorithm)
   */
  static validateCardNumber(cardNumber: string): { isValid: boolean; error?: string } {
    if (typeof cardNumber !== 'string') {
      return { isValid: false, error: 'Card number must be a string' };
    }

    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Check if all characters are digits
    if (!/^\d+$/.test(cleaned)) {
      return { isValid: false, error: 'Card number must contain only digits' };
    }

    // Check length (most cards are 13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) {
      return { isValid: false, error: 'Card number must be between 13 and 19 digits' };
    }

    // Luhn algorithm validation
    if (!this.luhnCheck(cleaned)) {
      return { isValid: false, error: 'Invalid card number' };
    }

    return { isValid: true };
  }

  /**
   * Validates expiry date format (MM/YY or MM/YYYY)
   */
  static validateExpiryDate(expiryDate: string): { isValid: boolean; error?: string } {
    if (typeof expiryDate !== 'string') {
      return { isValid: false, error: 'Expiry date must be a string' };
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/(0[0-9]|[1-9][0-9])$/;
    if (!expiryRegex.test(expiryDate)) {
      return { isValid: false, error: 'Expiry date must be in MM/YY format' };
    }

    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Last 2 digits
    const currentMonth = currentDate.getMonth() + 1;

    const expiryYear = parseInt(year);
    const expiryMonth = parseInt(month);

    // Check if card has expired
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }

    // Check if expiry is too far in the future (more than 10 years)
    if (expiryYear > currentYear + 10) {
      return { isValid: false, error: 'Expiry date is too far in the future' };
    }

    return { isValid: true };
  }

  /**
   * Validates CVV format
   */
  static validateCVV(cvv: string): { isValid: boolean; error?: string } {
    if (typeof cvv !== 'string') {
      return { isValid: false, error: 'CVV must be a string' };
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      return { isValid: false, error: 'CVV must be 3 or 4 digits' };
    }

    return { isValid: true };
  }

  /**
   * Validates bank account number format
   */
  static validateBankAccountNumber(accountNumber: string): { isValid: boolean; error?: string } {
    if (typeof accountNumber !== 'string') {
      return { isValid: false, error: 'Account number must be a string' };
    }

    const cleaned = accountNumber.replace(/\D/g, '');

    if (cleaned.length < 4) {
      return { isValid: false, error: 'Account number is too short' };
    }

    if (cleaned.length > 17) {
      return { isValid: false, error: 'Account number is too long' };
    }

    return { isValid: true };
  }

  /**
   * Validates routing number format
   */
  static validateRoutingNumber(routingNumber: string): { isValid: boolean; error?: string } {
    if (typeof routingNumber !== 'string') {
      return { isValid: false, error: 'Routing number must be a string' };
    }

    const cleaned = routingNumber.replace(/\D/g, '');

    if (cleaned.length !== 9) {
      return { isValid: false, error: 'Routing number must be 9 digits' };
    }

    // ABA routing number validation using checksum
    const digits = cleaned.split('').map(Number);
    const checksum = (3 * (digits[0] + digits[3] + digits[6])) +
                    (7 * (digits[1] + digits[4] + digits[7])) +
                    (1 * (digits[2] + digits[5] + digits[8]));

    if (checksum % 10 !== 0) {
      return { isValid: false, error: 'Invalid routing number' };
    }

    return { isValid: true };
  }

  /**
   * Luhn algorithm implementation for card number validation
   */
  private static luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Comprehensive validation for payment request
   */
  static validatePaymentRequest(request: {
    amount: number;
    currency: string;
    merchantId: string;
    tipPercentage?: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const amountValidation = this.validateAmount(request.amount);
    if (!amountValidation.isValid) {
      errors.push(amountValidation.error!);
    }

    const currencyValidation = this.validateCurrency(request.currency);
    if (!currencyValidation.isValid) {
      errors.push(currencyValidation.error!);
    }

    const merchantValidation = this.validateMerchantId(request.merchantId);
    if (!merchantValidation.isValid) {
      errors.push(merchantValidation.error!);
    }

    if (request.tipPercentage !== undefined) {
      const tipValidation = this.validateTipPercentage(request.tipPercentage);
      if (!tipValidation.isValid) {
        errors.push(tipValidation.error!);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}