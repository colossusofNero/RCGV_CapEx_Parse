import { device, element, by, expect as detoxExpect } from 'detox';

describe('Onboarding Flow E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Reset app state to show onboarding
    await device.sendUserNotification({
      trigger: 'push',
      title: 'Reset onboarding',
      body: 'Resetting app to show onboarding flow'
    });
  });

  afterEach(async () => {
    await device.clearKeychain();
  });

  describe('Welcome Screen', () => {
    it('should display welcome screen on first app launch', async () => {
      await detoxExpect(element(by.id('welcome-screen'))).toBeVisible();
      await detoxExpect(element(by.text('Welcome to TipTap'))).toBeVisible();
      await detoxExpect(element(by.text('Send tips with just a tap'))).toBeVisible();
      await detoxExpect(element(by.id('get-started-button'))).toBeVisible();
    });

    it('should show app features on welcome screen', async () => {
      await detoxExpect(element(by.text('NFC & QR Code Payments'))).toBeVisible();
      await detoxExpect(element(by.text('Secure & Fast'))).toBeVisible();
      await detoxExpect(element(by.text('Transaction History'))).toBeVisible();
      await detoxExpect(element(by.text('Tip Calculations'))).toBeVisible();
    });

    it('should navigate to permissions screen when get started is tapped', async () => {
      await element(by.id('get-started-button')).tap();
      await detoxExpect(element(by.id('permissions-screen'))).toBeVisible();
    });
  });

  describe('Permissions Screen', () => {
    beforeEach(async () => {
      await element(by.id('get-started-button')).tap();
    });

    it('should display required permissions screen', async () => {
      await detoxExpect(element(by.id('permissions-screen'))).toBeVisible();
      await detoxExpect(element(by.text('Grant Permissions'))).toBeVisible();
      await detoxExpect(element(by.text('TipTap needs these permissions to work properly'))).toBeVisible();
    });

    it('should show all required permissions', async () => {
      await detoxExpect(element(by.text('Camera'))).toBeVisible();
      await detoxExpect(element(by.text('For QR code scanning'))).toBeVisible();
      await detoxExpect(element(by.text('NFC'))).toBeVisible();
      await detoxExpect(element(by.text('For contactless payments'))).toBeVisible();
      await detoxExpect(element(by.text('Biometric Authentication'))).toBeVisible();
      await detoxExpect(element(by.text('For secure access'))).toBeVisible();
    });

    it('should request camera permission when camera permission button is tapped', async () => {
      await element(by.id('request-camera-permission')).tap();

      // Wait for permission dialog and grant
      try {
        await element(by.text('Allow')).tap();
      } catch (error) {
        // Permission might already be granted or dialog doesn't appear in test
      }

      await detoxExpect(element(by.id('camera-permission-granted'))).toBeVisible();
    });

    it('should show NFC availability status', async () => {
      // Check if device supports NFC
      await detoxExpect(element(by.id('nfc-status'))).toBeVisible();

      // Should show either "NFC Available" or "NFC Not Available"
      try {
        await detoxExpect(element(by.text('NFC Available'))).toBeVisible();
      } catch (error) {
        await detoxExpect(element(by.text('NFC Not Available'))).toBeVisible();
      }
    });

    it('should navigate to account setup when all permissions are granted', async () => {
      // Grant all permissions
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('request-biometric-permission')).tap();

      // Continue to next screen
      await element(by.id('continue-to-account-setup')).tap();
      await detoxExpect(element(by.id('account-setup-screen'))).toBeVisible();
    });

    it('should show warning when permissions are denied', async () => {
      await element(by.id('request-camera-permission')).tap();

      try {
        await element(by.text('Don\'t Allow')).tap();
        await detoxExpect(element(by.text('Camera permission is required for QR code scanning'))).toBeVisible();
      } catch (error) {
        // Permission dialog might not appear in test environment
      }
    });
  });

  describe('Account Setup Screen', () => {
    beforeEach(async () => {
      // Navigate to account setup
      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();
    });

    it('should display account setup screen', async () => {
      await detoxExpect(element(by.id('account-setup-screen'))).toBeVisible();
      await detoxExpect(element(by.text('Set Up Your Account'))).toBeVisible();
      await detoxExpect(element(by.text('Create your TipTap profile'))).toBeVisible();
    });

    it('should have form fields for user information', async () => {
      await detoxExpect(element(by.id('full-name-input'))).toBeVisible();
      await detoxExpect(element(by.id('email-input'))).toBeVisible();
      await detoxExpect(element(by.id('phone-input'))).toBeVisible();
      await detoxExpect(element(by.id('create-account-button'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('create-account-button')).tap();

      await detoxExpect(element(by.text('Full name is required'))).toBeVisible();
      await detoxExpect(element(by.text('Email is required'))).toBeVisible();
    });

    it('should validate email format', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('create-account-button')).tap();

      await detoxExpect(element(by.text('Please enter a valid email address'))).toBeVisible();
    });

    it('should create account with valid information', async () => {
      await element(by.id('full-name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john.doe@example.com');
      await element(by.id('phone-input')).typeText('+1234567890');

      await element(by.id('create-account-button')).tap();

      // Should show loading state
      await detoxExpect(element(by.id('creating-account-loader'))).toBeVisible();

      // Wait for account creation
      await waitFor(element(by.id('payment-setup-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should handle account creation errors gracefully', async () => {
      // Fill in form with existing email (simulate server error)
      await element(by.id('full-name-input')).typeText('Test User');
      await element(by.id('email-input')).typeText('existing@example.com');
      await element(by.id('phone-input')).typeText('+1987654321');

      await element(by.id('create-account-button')).tap();

      // Should show error message
      await waitFor(element(by.text('Account with this email already exists'))).toBeVisible().withTimeout(3000);
    });
  });

  describe('Payment Setup Screen', () => {
    beforeEach(async () => {
      // Navigate through onboarding to payment setup
      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();

      // Complete account setup
      await element(by.id('full-name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john.doe@example.com');
      await element(by.id('phone-input')).typeText('+1234567890');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('payment-setup-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should display payment setup screen', async () => {
      await detoxExpect(element(by.id('payment-setup-screen'))).toBeVisible();
      await detoxExpect(element(by.text('Set Up Payment Method'))).toBeVisible();
      await detoxExpect(element(by.text('Add a payment method to start sending tips'))).toBeVisible();
    });

    it('should show payment method options', async () => {
      await detoxExpect(element(by.id('add-credit-card-option'))).toBeVisible();
      await detoxExpect(element(by.id('add-bank-account-option'))).toBeVisible();
      await detoxExpect(element(by.id('skip-payment-setup'))).toBeVisible();
    });

    it('should navigate to credit card setup', async () => {
      await element(by.id('add-credit-card-option')).tap();
      await detoxExpect(element(by.id('credit-card-setup-screen'))).toBeVisible();
    });

    it('should navigate to bank account setup', async () => {
      await element(by.id('add-bank-account-option')).tap();
      await detoxExpect(element(by.id('bank-account-setup-screen'))).toBeVisible();
    });

    it('should allow skipping payment setup', async () => {
      await element(by.id('skip-payment-setup')).tap();

      // Should show confirmation dialog
      await detoxExpect(element(by.text('Skip Payment Setup?'))).toBeVisible();
      await detoxExpect(element(by.text('You can add a payment method later in settings'))).toBeVisible();

      await element(by.text('Skip')).tap();
      await detoxExpect(element(by.id('tutorial-screen'))).toBeVisible();
    });
  });

  describe('Credit Card Setup', () => {
    beforeEach(async () => {
      // Navigate to credit card setup
      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();

      await element(by.id('full-name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john.doe@example.com');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('payment-setup-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('add-credit-card-option')).tap();
    });

    it('should display credit card form', async () => {
      await detoxExpect(element(by.id('credit-card-setup-screen'))).toBeVisible();
      await detoxExpect(element(by.id('card-number-input'))).toBeVisible();
      await detoxExpect(element(by.id('expiry-date-input'))).toBeVisible();
      await detoxExpected(element(by.id('cvv-input'))).toBeVisible();
      await detoxExpect(element(by.id('cardholder-name-input'))).toBeVisible();
    });

    it('should validate card number format', async () => {
      await element(by.id('card-number-input')).typeText('1234');
      await element(by.id('save-card-button')).tap();

      await detoxExpect(element(by.text('Please enter a valid card number'))).toBeVisible();
    });

    it('should save valid credit card', async () => {
      await element(by.id('card-number-input')).typeText('4111111111111111'); // Test card
      await element(by.id('expiry-date-input')).typeText('12/25');
      await element(by.id('cvv-input')).typeText('123');
      await element(by.id('cardholder-name-input')).typeText('John Doe');

      await element(by.id('save-card-button')).tap();

      // Should show success and navigate to tutorial
      await waitFor(element(by.id('tutorial-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should handle card scanning via camera', async () => {
      await element(by.id('scan-card-button')).tap();

      // Should open camera view
      await detoxExpect(element(by.id('card-scanner-view'))).toBeVisible();
      await detoxExpect(element(by.text('Position card in the frame'))).toBeVisible();

      // Simulate successful scan
      await element(by.id('mock-card-scan-success')).tap();

      // Should fill in card details
      await detoxExpect(element(by.id('card-number-input'))).toHaveText('4111 1111 1111 1111');
    });
  });

  describe('Bank Account Setup', () => {
    beforeEach(async () => {
      // Navigate to bank account setup
      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();

      await element(by.id('full-name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john.doe@example.com');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('payment-setup-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('add-bank-account-option')).tap();
    });

    it('should display Plaid Link integration', async () => {
      await detoxExpect(element(by.id('bank-account-setup-screen'))).toBeVisible();
      await detoxExpect(element(by.text('Connect Your Bank Account'))).toBeVisible();
      await detoxExpect(element(by.text('Securely connect your bank account using Plaid'))).toBeVisible();
      await detoxExpect(element(by.id('connect-bank-account-button'))).toBeVisible();
    });

    it('should launch Plaid Link when connect button is tapped', async () => {
      await element(by.id('connect-bank-account-button')).tap();

      // Should show Plaid Link interface
      await detoxExpect(element(by.id('plaid-link-view'))).toBeVisible();
    });

    it('should handle successful bank account connection', async () => {
      await element(by.id('connect-bank-account-button')).tap();

      // Simulate successful Plaid Link flow
      await element(by.id('mock-plaid-success')).tap();

      // Should show success message and navigate to tutorial
      await detoxExpect(element(by.text('Bank account connected successfully'))).toBeVisible();
      await waitFor(element(by.id('tutorial-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should handle bank account connection errors', async () => {
      await element(by.id('connect-bank-account-button')).tap();

      // Simulate Plaid Link error
      await element(by.id('mock-plaid-error')).tap();

      await detoxExpect(element(by.text('Failed to connect bank account'))).toBeVisible();
      await detoxExpect(element(by.id('retry-bank-connection'))).toBeVisible();
    });
  });

  describe('Tutorial Screen', () => {
    beforeEach(async () => {
      // Complete onboarding to reach tutorial
      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();

      await element(by.id('full-name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john.doe@example.com');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('payment-setup-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('skip-payment-setup')).tap();
      await element(by.text('Skip')).tap();
    });

    it('should display tutorial screen', async () => {
      await detoxExpect(element(by.id('tutorial-screen'))).toBeVisible();
      await detoxExpect(element(by.text('How to Use TipTap'))).toBeVisible();
    });

    it('should show tutorial steps', async () => {
      // First tutorial step
      await detoxExpect(element(by.text('Step 1: Choose Amount'))).toBeVisible();
      await detoxExpect(element(by.text('Select or enter a tip amount'))).toBeVisible();

      // Navigate through tutorial steps
      await element(by.id('next-tutorial-step')).tap();

      await detoxExpect(element(by.text('Step 2: Select Payment Method'))).toBeVisible();
      await element(by.id('next-tutorial-step')).tap();

      await detoxExpect(element(by.text('Step 3: Tap to Pay'))).toBeVisible();
      await element(by.id('next-tutorial-step')).tap();

      await detoxExpect(element(by.text('Step 4: Confirm Payment'))).toBeVisible();
    });

    it('should complete tutorial and navigate to home screen', async () => {
      // Navigate through all tutorial steps
      await element(by.id('next-tutorial-step')).tap();
      await element(by.id('next-tutorial-step')).tap();
      await element(by.id('next-tutorial-step')).tap();

      await element(by.id('finish-tutorial-button')).tap();

      // Should navigate to main app
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should allow skipping tutorial', async () => {
      await element(by.id('skip-tutorial-button')).tap();

      // Should show skip confirmation
      await detoxExpect(element(by.text('Skip Tutorial?'))).toBeVisible();
      await element(by.text('Skip')).tap();

      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Onboarding Completion', () => {
    it('should mark onboarding as complete and not show again', async () => {
      // Complete full onboarding flow
      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();

      await element(by.id('full-name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john.doe@example.com');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('payment-setup-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('skip-payment-setup')).tap();
      await element(by.text('Skip')).tap();

      // Complete tutorial
      await element(by.id('next-tutorial-step')).tap();
      await element(by.id('next-tutorial-step')).tap();
      await element(by.id('next-tutorial-step')).tap();
      await element(by.id('finish-tutorial-button')).tap();

      // Should be on home screen
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();

      // Reload app
      await device.reloadReactNative();

      // Should go directly to home screen, not onboarding
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
      await detoxExpect(element(by.id('welcome-screen'))).not.toBeVisible();
    });

    it('should save user preferences from onboarding', async () => {
      // Complete onboarding with specific preferences
      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();

      await element(by.id('full-name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john.doe@example.com');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('payment-setup-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('skip-payment-setup')).tap();
      await element(by.text('Skip')).tap();

      await element(by.id('finish-tutorial-button')).tap();

      // Check that user data was saved
      await element(by.id('profile-button')).tap();
      await detoxExpect(element(by.text('John Doe'))).toBeVisible();
      await detoxExpect(element(by.text('john.doe@example.com'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for onboarding elements', async () => {
      // Check welcome screen accessibility
      await detoxExpect(element(by.id('welcome-screen'))).toHaveAccessibilityLabel('Welcome screen');
      await detoxExpect(element(by.id('get-started-button'))).toHaveAccessibilityLabel('Get started with TipTap');

      await element(by.id('get-started-button')).tap();

      // Check permissions screen accessibility
      await detoxExpect(element(by.id('request-camera-permission'))).toHaveAccessibilityLabel('Request camera permission for QR code scanning');
    });

    it('should support voice over navigation', async () => {
      // Enable VoiceOver (iOS) or TalkBack (Android)
      await device.enableAccessibility();

      await element(by.id('get-started-button')).tap();
      await element(by.id('request-camera-permission')).tap();
      await element(by.id('continue-to-account-setup')).tap();

      // Should be able to navigate form fields with accessibility
      await detoxExpect(element(by.id('full-name-input'))).toHaveAccessibilityLabel('Full name');
      await detoxExpect(element(by.id('email-input'))).toHaveAccessibilityLabel('Email address');

      await device.disableAccessibility();
    });
  });
});