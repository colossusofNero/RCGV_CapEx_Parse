import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppContext} from '@/context/AppContext';
import NFCPayment from '@/components/NFCPayment';
import QRPayment from '@/components/QRPayment';
import {PaymentService} from '@/services/PaymentService';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {method, amount} = route.params as {method: 'nfc' | 'qr'; amount: number};
  const {dispatch} = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = async (transactionId: string) => {
    try {
      setIsProcessing(true);

      const transaction = await PaymentService.processPayment({
        id: transactionId,
        amount,
        method,
        timestamp: new Date(),
        status: 'completed',
        currency: 'USD',
      });

      dispatch({type: 'ADD_TRANSACTION', payload: transaction});

      Alert.alert(
        'Payment Successful!',
        `Tip of $${amount.toFixed(2)} has been sent successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Payment Failed', 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Payment Error', error);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.content}>
        <View style={styles.amountDisplay}>
          <Text style={styles.amountLabel}>Tip Amount</Text>
          <Text style={styles.amount}>${amount.toFixed(2)}</Text>
        </View>

        <View style={styles.paymentContainer}>
          {method === 'nfc' ? (
            <NFCPayment
              amount={amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <QRPayment
              amount={amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </View>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Processing payment...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 30,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentContainer: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
  },
});

export default PaymentScreen;