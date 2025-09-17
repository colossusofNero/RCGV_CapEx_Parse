// Base Payment Component - Eliminates UI duplication across payment methods
import React, { ReactNode, memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLoadingState } from './hooks/useLoadingState';
import { useCurrencyFormatter } from './hooks/useCurrencyFormatter';

export interface BasePaymentProps {
  amount: number;
  currency: string;
  merchantName: string;
  description?: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  children: ReactNode;
  paymentMethodTitle: string;
}

const BasePaymentComponent = memo<BasePaymentProps>(({
  amount,
  currency,
  merchantName,
  description,
  onSuccess,
  onError,
  onCancel,
  children,
  paymentMethodTitle
}) => {
  const { loading, error, executeAsync } = useLoadingState();
  const formattedAmount = useCurrencyFormatter(amount, currency);

  const containerStyle = useMemo(() => [
    styles.container,
    loading && styles.containerLoading
  ], [loading]);

  const handleCancel = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <Text style={styles.title}>{paymentMethodTitle}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.merchantName}>{merchantName}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
        <Text style={styles.amount}>{formattedAmount}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.paymentMethodContainer}>
        {React.cloneElement(children as React.ReactElement, {
          loading,
          onProcessPayment: executeAsync,
          onSuccess,
          onError
        })}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.buttonDisabled]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  containerLoading: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  paymentInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#059669',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  paymentMethodContainer: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default BasePaymentComponent;