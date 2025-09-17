import { device, element, by, expect as detoxExpect } from 'detox';

describe('Tip Payment Flow E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Assume user has completed onboarding and is on home screen
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
  });

  describe('NFC Payment Flow', () => {
    it('should complete NFC tip payment successfully', async () => {
      // Navigate to tip amount screen
      await element(by.id('start-tip-button')).tap();
      await detoxExpect(element(by.id('tip-amount-screen'))).toBeVisible();

      // Select tip amount
      await element(by.id('amount-25-button')).tap();
      await element(by.id('tip-18-percent-button')).tap();

      // Verify calculated total
      await detoxExpected(element(by.id('tip-amount-display'))).toHaveText('$4.50');
      await detoxExpected(element(by.id('total-amount-display'))).toHaveText('$29.50');

      // Proceed to payment
      await element(by.id('continue-to-payment-button')).tap();
      await detoxExpected(element(by.id('payment-screen'))).toBeVisible();

      // Select NFC payment method
      await element(by.id('nfc-payment-method')).tap();

      // Check if NFC is available
      try {
        await detoxExpected(element(by.text('NFC Available'))).toBeVisible();

        // Start NFC payment
        await element(by.id('start-nfc-payment')).tap();
        await detoxExpected(element(by.id('nfc-scanning-view'))).toBeVisible();
        await detoxExpected(element(by.text('Hold your device near the NFC tag'))).toBeVisible();

        // Simulate NFC tag detected
        await element(by.id('mock-nfc-tag-detected')).tap();

        // Should show payment processing
        await detoxExpected(element(by.id('payment-processing-view'))).toBeVisible();
        await detoxExpected(element(by.text('Processing payment...'))).toBeVisible();

        // Wait for success
        await waitFor(element(by.id('payment-success-view'))).toBeVisible().withTimeout(10000);
        await detoxExpected(element(by.text('Payment Successful!'))).toBeVisible();
        await detoxExpected(element(by.text('$29.50'))).toBeVisible();

      } catch (error) {
        // NFC not available on device
        await detoxExpected(element(by.text('NFC Not Available'))).toBeVisible();
        await detoxExpected(element(by.text('Use QR Code instead'))).toBeVisible();
      }
    });

    it('should fallback to QR when NFC fails', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-50-button')).tap();
      await element(by.id('tip-20-percent-button')).tap();
      await element(by.id('continue-to-payment-button')).tap();

      await element(by.id('nfc-payment-method')).tap();

      if (await element(by.text('NFC Available')).isVisible()) {
        await element(by.id('start-nfc-payment')).tap();

        // Simulate NFC timeout/failure
        await element(by.id('mock-nfc-timeout')).tap();

        // Should show fallback option
        await detoxExpected(element(by.text('NFC payment failed'))).toBeVisible();
        await detoxExpected(element(by.id('fallback-to-qr-button'))).toBeVisible();

        // Use QR fallback
        await element(by.id('fallback-to-qr-button')).tap();
        await detoxExpected(element(by.id('qr-code-view'))).toBeVisible();
      }
    });

    it('should handle NFC payment errors gracefully', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-30-button')).tap();
      await element(by.id('tip-15-percent-button')).tap();
      await element(by.id('continue-to-payment-button')).tap();

      await element(by.id('nfc-payment-method')).tap();

      if (await element(by.text('NFC Available')).isVisible()) {
        await element(by.id('start-nfc-payment')).tap();

        // Simulate NFC error
        await element(by.id('mock-nfc-error')).tap();

        // Should show error message
        await detoxExpected(element(by.text('NFC payment failed'))).toBeVisible();
        await detoxExpected(element(by.id('retry-payment-button'))).toBeVisible();
        await detoxExpected(element(by.id('cancel-payment-button'))).toBeVisible();

        // Test retry
        await element(by.id('retry-payment-button')).tap();
        await detoxExpected(element(by.id('nfc-scanning-view'))).toBeVisible();
      }
    });
  });

  describe('QR Code Payment Flow', () => {
    it('should complete QR code tip payment successfully', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-40-button')).tap();
      await element(by.id('tip-22-percent-button')).tap();

      // Verify calculated amounts
      await detoxExpected(element(by.id('tip-amount-display'))).toHaveText('$8.80');
      await detoxExpected(element(by.id('total-amount-display'))).toHaveText('$48.80');

      await element(by.id('continue-to-payment-button')).tap();

      // Select QR code payment method
      await element(by.id('qr-payment-method')).tap();

      // Should show QR code generation
      await detoxExpected(element(by.id('qr-code-view'))).toBeVisible();
      await detoxExpected(element(by.text('Show this QR code to complete payment'))).toBeVisible();
      await detoxExpected(element(by.id('qr-code-image'))).toBeVisible();

      // Should show payment details
      await detoxExpected(element(by.text('Amount: $40.00'))).toBeVisible();
      await detoxExpected(element(by.text('Tip: $8.80 (22%)'))).toBeVisible();
      await detoxExpected(element(by.text('Total: $48.80'))).toBeVisible();

      // Simulate QR code scanned by merchant
      await element(by.id('mock-qr-scanned')).tap();

      // Should show payment processing
      await detoxExpected(element(by.id('payment-processing-view'))).toBeVisible();

      // Wait for success
      await waitFor(element(by.id('payment-success-view'))).toBeVisible().withTimeout(10000);
      await detoxExpected(element(by.text('Payment Successful!'))).toBeVisible();
      await detoxExpected(element(by.text('$48.80'))).toBeVisible();
    });

    it('should handle QR code payment timeout', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-35-button')).tap();
      await element(by.id('continue-to-payment-button')).tap();

      await element(by.id('qr-payment-method')).tap();
      await detoxExpected(element(by.id('qr-code-view'))).toBeVisible();

      // Should show timeout countdown
      await detoxExpected(element(by.id('payment-timeout-counter'))).toBeVisible();

      // Simulate timeout
      await element(by.id('mock-payment-timeout')).tap();

      await detoxExpected(element(by.text('Payment timeout'))).toBeVisible();
      await detoxExpected(element(by.text('The payment session has expired'))).toBeVisible();
      await detoxExpected(element(by.id('retry-payment-button'))).toBeVisible();
    });

    it('should allow refreshing QR code', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('custom-amount-input')).typeText('55.75');
      await element(by.id('continue-to-payment-button')).tap();

      await element(by.id('qr-payment-method')).tap();

      // Refresh QR code
      await element(by.id('refresh-qr-button')).tap();
      await detoxExpected(element(by.text('QR code refreshed'))).toBeVisible();
      await detoxExpected(element(by.id('qr-code-image'))).toBeVisible();
    });
  });

  describe('Custom Tip Amount', () => {
    it('should allow entering custom tip amount', async () => {
      await element(by.id('start-tip-button')).tap();

      // Enter custom base amount
      await element(by.id('custom-amount-input')).typeText('75.50');

      // Enter custom tip percentage
      await element(by.id('custom-tip-percentage-input')).typeText('19');

      // Verify calculation
      await detoxExpected(element(by.id('tip-amount-display'))).toHaveText('$14.35'); // 75.50 * 0.19
      await detoxExpected(element(by.id('total-amount-display'))).toHaveText('$89.85');

      await element(by.id('continue-to-payment-button')).tap();
      await element(by.id('qr-payment-method')).tap();

      await detoxExpected(element(by.text('Amount: $75.50'))).toBeVisible();
      await detoxExpected(element(by.text('Tip: $14.35 (19%)'))).toBeVisible();
    });

    it('should validate custom amounts', async () => {
      await element(by.id('start-tip-button')).tap();

      // Test invalid amounts
      await element(by.id('custom-amount-input')).typeText('0');
      await detoxExpected(element(by.text('Amount must be greater than $0'))).toBeVisible();

      await element(by.id('custom-amount-input')).clearText();
      await element(by.id('custom-amount-input')).typeText('-5');
      await detoxExpected(element(by.text('Amount cannot be negative'))).toBeVisible();

      // Test valid amount
      await element(by.id('custom-amount-input')).clearText();
      await element(by.id('custom-amount-input')).typeText('25.00');
      await detoxExpected(element(by.id('continue-to-payment-button'))).toBeEnabled();
    });

    it('should handle very large tip amounts', async () => {
      await element(by.id('start-tip-button')).tap();

      await element(by.id('custom-amount-input')).typeText('1000.00');
      await element(by.id('custom-tip-percentage-input')).typeText('50'); // 50% tip

      await detoxExpected(element(by.id('tip-amount-display'))).toHaveText('$500.00');
      await detoxExpected(element(by.id('total-amount-display'))).toHaveText('$1,500.00');

      // Should show confirmation for large amounts
      await element(by.id('continue-to-payment-button')).tap();
      await detoxExpected(element(by.text('Confirm Large Tip'))).toBeVisible();
      await detoxExpected(element(by.text('You are about to tip $500.00. Continue?'))).toBeVisible();

      await element(by.text('Confirm')).tap();
      await detoxExpected(element(by.id('payment-screen'))).toBeVisible();
    });
  });

  describe('Transaction History', () => {
    beforeEach(async () => {
      // Complete a payment first
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-20-button')).tap();
      await element(by.id('continue-to-payment-button')).tap();
      await element(by.id('qr-payment-method')).tap();
      await element(by.id('mock-qr-scanned')).tap();
      await waitFor(element(by.id('payment-success-view'))).toBeVisible().withTimeout(5000);
      await element(by.id('done-button')).tap();
    });

    it('should show transaction in history', async () => {
      // Navigate to transaction history
      await element(by.id('history-tab')).tap();
      await detoxExpected(element(by.id('transaction-history-screen'))).toBeVisible();

      // Should show recent transaction
      await detoxExpected(element(by.text('$20.00'))).toBeVisible();
      await detoxExpected(element(by.text('Completed'))).toBeVisible();
      await detoxExpected(element(by.id('transaction-item-0'))).toBeVisible();
    });

    it('should show transaction details when tapped', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('transaction-item-0')).tap();

      await detoxExpected(element(by.id('transaction-detail-screen'))).toBeVisible();
      await detoxExpected(element(by.text('Transaction Details'))).toBeVisible();
      await detoxExpected(element(by.text('Amount: $20.00'))).toBeVisible();
      await detoxExpected(element(by.text('Status: Completed'))).toBeVisible();
      await detoxExpected(element(by.text('Payment Method: QR Code'))).toBeVisible();
    });

    it('should filter transactions by date range', async () => {
      await element(by.id('history-tab')).tap();

      // Open date filter
      await element(by.id('filter-button')).tap();
      await detoxExpected(element(by.id('date-filter-modal'))).toBeVisible();

      // Select last 7 days
      await element(by.id('last-7-days-filter')).tap();
      await element(by.id('apply-filter-button')).tap();

      // Should show filtered results
      await detoxExpected(element(by.text('Last 7 days'))).toBeVisible();
    });
  });

  describe('Settings and Limits', () => {
    it('should navigate to settings and modify tip limits', async () => {
      await element(by.id('settings-tab')).tap();
      await detoxExpected(element(by.id('settings-screen'))).toBeVisible();

      // Navigate to tip limits
      await element(by.id('tip-limits-setting')).tap();
      await detoxExpected(element(by.id('tip-limits-screen'))).toBeVisible();

      // Modify daily limit
      await element(by.id('daily-limit-input')).clearText();
      await element(by.id('daily-limit-input')).typeText('150');

      // Save changes
      await element(by.id('save-limits-button')).tap();
      await detoxExpected(element(by.text('Tip limits updated'))).toBeVisible();
    });

    it('should enforce tip limits during payment', async () => {
      // Set low daily limit
      await element(by.id('settings-tab')).tap();
      await element(by.id('tip-limits-setting')).tap();
      await element(by.id('daily-limit-input')).clearText();
      await element(by.id('daily-limit-input')).typeText('10');
      await element(by.id('save-limits-button')).tap();

      // Go back to home
      await element(by.id('home-tab')).tap();

      // Try to tip more than limit
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-25-button')).tap(); // $25 > $10 limit
      await element(by.id('continue-to-payment-button')).tap();

      // Should show limit exceeded error
      await detoxExpected(element(by.text('Daily Tip Limit Exceeded'))).toBeVisible();
      await detoxExpected(element(by.text('This tip would exceed your daily limit of $10'))).toBeVisible();
    });

    it('should modify default tip percentages', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('default-tips-setting')).tap();

      await detoxExpected(element(by.id('default-tips-screen'))).toBeVisible();

      // Modify tip percentages
      await element(by.id('tip-percentage-1-input')).clearText();
      await element(by.id('tip-percentage-1-input')).typeText('12');

      await element(by.id('save-default-tips-button')).tap();

      // Verify changes are applied
      await element(by.id('home-tab')).tap();
      await element(by.id('start-tip-button')).tap();

      await detoxExpected(element(by.text('12%'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during payment', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-30-button')).tap();
      await element(by.id('continue-to-payment-button')).tap();
      await element(by.id('qr-payment-method')).tap();

      // Simulate network error
      await element(by.id('mock-network-error')).tap();

      await detoxExpected(element(by.text('Network Error'))).toBeVisible();
      await detoxExpected(element(by.text('Please check your internet connection'))).toBeVisible();
      await detoxExpected(element(by.id('retry-payment-button'))).toBeVisible();
    });

    it('should handle payment declined scenarios', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-45-button')).tap();
      await element(by.id('continue-to-payment-button')).tap();
      await element(by.id('qr-payment-method')).tap();

      // Simulate payment declined
      await element(by.id('mock-payment-declined')).tap();

      await detoxExpected(element(by.text('Payment Declined'))).toBeVisible();
      await detoxExpected(element(by.text('Your payment method was declined'))).toBeVisible();
      await detoxExpected(element(by.id('try-different-method-button'))).toBeVisible();
    });

    it('should recover from app crashes gracefully', async () => {
      await element(by.id('start-tip-button')).tap();
      await element(by.id('amount-25-button')).tap();
      await element(by.id('continue-to-payment-button')).tap();

      // Simulate app crash and restart
      await device.reloadReactNative();

      // Should show recovery screen or return to safe state
      try {
        await detoxExpected(element(by.id('payment-recovery-screen'))).toBeVisible();
        await detoxExpected(element(by.text('Incomplete Payment Detected'))).toBeVisible();
        await element(by.id('recover-payment-button')).tap();
      } catch {
        // Or should return to home screen safely
        await detoxExpected(element(by.id('home-screen'))).toBeVisible();
      }
    });
  });

  describe('Performance', () => {
    it('should load screens quickly', async () => {
      const startTime = Date.now();

      await element(by.id('start-tip-button')).tap();
      await waitFor(element(by.id('tip-amount-screen'))).toBeVisible().withTimeout(2000);

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
    });

    it('should handle rapid navigation without crashes', async () => {
      // Rapidly navigate between screens
      for (let i = 0; i < 5; i++) {
        await element(by.id('start-tip-button')).tap();
        await element(by.id('back-button')).tap();
        await element(by.id('history-tab')).tap();
        await element(by.id('home-tab')).tap();
      }

      // Should still be functional
      await detoxExpected(element(by.id('home-screen'))).toBeVisible();
      await element(by.id('start-tip-button')).tap();
      await detoxExpected(element(by.id('tip-amount-screen'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', async () => {
      await device.enableAccessibility();

      await element(by.id('start-tip-button')).tap();

      // Check accessibility labels
      await detoxExpected(element(by.id('amount-25-button'))).toHaveAccessibilityLabel('Twenty five dollars');
      await detoxExpected(element(by.id('tip-18-percent-button'))).toHaveAccessibilityLabel('Eighteen percent tip');

      await device.disableAccessibility();
    });

    it('should support large text scaling', async () => {
      // Test app with larger text sizes
      await device.setAccessibilityFontScale(2.0);

      await element(by.id('start-tip-button')).tap();

      // Should still be functional with larger text
      await detoxExpected(element(by.id('tip-amount-screen'))).toBeVisible();
      await detoxExpected(element(by.id('amount-25-button'))).toBeVisible();

      await device.setAccessibilityFontScale(1.0);
    });
  });
});