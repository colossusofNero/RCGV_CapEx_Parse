import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import StripeService from '@/services/StripeService';

interface StripePaymentProps {
  amount: number;
  currency: string;
  description?: string;
  customerId?: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel: () => void;
}

const StripePaymentForm: React.FC<StripePaymentProps> = ({
  amount,
  currency,
  description,
  customerId,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardValid, setCardValid] = useState(false);
  const stripeService = StripeService.getInstance();

  const handlePayment = async () => {
    if (!cardValid) {
      Alert.alert('Error', 'Please enter valid card details');
      return;
    }

    try {
      setLoading(true);

      // Generate idempotency key
      const idempotencyKey = stripeService.generateIdempotencyKey();

      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent({
        amount,
        currency,
        customerId,
        description,
      }, idempotencyKey);

      // Confirm payment
      const { error, paymentIntent: confirmedPaymentIntent } = await confirmPayment(
        paymentIntent.clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        if (error.code === 'Canceled') {
          onPaymentCancel();
        } else {
          onPaymentError(error.message || 'Payment failed');
        }
      } else if (confirmedPaymentIntent) {
        onPaymentSuccess(confirmedPaymentIntent.id);
      }
    } catch (error: any) {
      onPaymentError(error.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Card Payment</Text>
      <Text style={styles.amount}>
        {currency.toUpperCase()} {(amount / 100).toFixed(2)}
      </Text>

      <CardField
        postalCodeEnabled={true}
        placeholders={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={styles.cardField}
        style={styles.cardContainer}
        onCardChange={(cardDetails) => {
          setCardValid(cardDetails.complete);
        }}
      />

      <TouchableOpacity
        style={[styles.payButton, (!cardValid || loading) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={!cardValid || loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : `Pay ${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onPaymentCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

interface StripePaymentWrapperProps extends StripePaymentProps {
  publishableKey: string;
}

const StripePayment: React.FC<StripePaymentWrapperProps> = ({
  publishableKey,
  ...props
}) => {
  return (
    <StripeProvider publishableKey={publishableKey}>
      <StripePaymentForm {...props} />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF',
  },
  cardContainer: {
    height: 50,
    marginVertical: 20,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  payButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  payButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 15,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default StripePayment;