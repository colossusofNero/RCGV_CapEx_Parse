import React, {memo, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootState} from '@/store';

const HomeScreen = memo(() => {
  const navigation = useNavigation();
  const settings = useSelector((state: RootState) => state.settings.tipSettings);

  const handlePaymentMethod = useCallback((method: 'nfc' | 'qr') => {
    navigation.navigate('TipAmount', {method});
  }, [navigation]);

  const remainingLimit = useMemo(() => {
    return `${settings.dailyLimit} ${settings.currency}`;
  }, [settings.dailyLimit, settings.currency]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>TipTap</Text>
        <Text style={styles.subtitle}>Choose your payment method</Text>
      </View>

      <View style={styles.paymentMethods}>
        <TouchableOpacity
          style={[styles.methodButton, styles.nfcButton]}
          onPress={() => handlePaymentMethod('nfc')}>
          <Icon name="nfc" size={48} color="#fff" />
          <Text style={styles.methodText}>NFC Payment</Text>
          <Text style={styles.methodSubtext}>Tap to pay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodButton, styles.qrButton]}
          onPress={() => handlePaymentMethod('qr')}>
          <Icon name="qr-code" size={48} color="#fff" />
          <Text style={styles.methodText}>QR Code</Text>
          <Text style={styles.methodSubtext}>Scan to pay</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.limitsInfo}>
        <Text style={styles.limitsTitle}>Daily Limits</Text>
        <Text style={styles.limitsText}>
          Remaining: ${remainingLimit}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  paymentMethods: {
    flex: 1,
    justifyContent: 'center',
    gap: 30,
  },
  methodButton: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nfcButton: {
    backgroundColor: '#007AFF',
  },
  qrButton: {
    backgroundColor: '#34C759',
  },
  methodText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  methodSubtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  limitsInfo: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  limitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  limitsText: {
    fontSize: 16,
    color: '#666',
  },
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;