// Refactored Stripe Payment - Uses shared components and hooks
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BasePaymentComponent from './BasePaymentComponent';
import { useLoadingState } from './hooks/useLoadingState';
import { UnifiedPaymentService } from './UnifiedPaymentService';
import { PaymentMethod } from '@/domain/entities/Transaction';

interface RefactoredStripePaymentProps {
  amount: number;
  currency: string;
  merchantId: string;
  merchantName: string;
  customerId?: string;
  description?: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const RefactoredStripePayment = memo<RefactoredStripePaymentProps>(({
  amount,
  currency,
  merchantId,
  merchantName,
  customerId,
  description,
  onSuccess,
  onError,
  onCancel
}) => {
  const { loading } = useLoadingState();

  const handlePayment = useCallback(async () => {
    const paymentService = UnifiedPaymentService.getInstance();

    const result = await paymentService.processPayment({
      amount,
      currency,
      merchantId,
      customerId,
      paymentMethod: PaymentMethod.STRIPE_CARD,
      description,
      metadata: {
        paymentInterface: 'mobile',
        source: 'stripe_component'
      }
    });

    if (result.success && result.transaction) {
      onSuccess(result.transaction.id);
    } else if (result.error) {
      onError(result.error.message);
    }
  }, [amount, currency, merchantId, customerId, description, onSuccess, onError]);

  return (
    <BasePaymentComponent
      amount={amount}
      currency={currency}
      merchantName={merchantName}
      description={description}
      onSuccess={onSuccess}
      onError={onError}
      onCancel={onCancel}
      paymentMethodTitle="Credit Card Payment"
    >
      <StripePaymentForm
        loading={loading}
        onProcessPayment={handlePayment}
      />
    </BasePaymentComponent>
  );
});

// Simplified payment form component
interface StripePaymentFormProps {
  loading?: boolean;
  onProcessPayment: () => Promise<void>;
}

const StripePaymentForm = memo<StripePaymentFormProps>(({
  loading,
  onProcessPayment
}) => {
  return (
    <View style={styles.formContainer}>
      <View style={styles.cardInputContainer}>
        {/* Stripe card input would go here */}
        <Text style={styles.cardInputPlaceholder}>
          Card Number: **** **** **** ****
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={onProcessPayment}
        disabled={loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
  },
  cardInputContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  cardInputPlaceholder: {
    color: '#6b7280',
    fontSize: 16,
  },
  payButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RefactoredStripePayment;