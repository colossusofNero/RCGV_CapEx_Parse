import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList, BankAccount} from '@/types';

type BankCredentialsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BankCredentials'
>;

type BankCredentialsScreenRouteProp = RouteProp<
  RootStackParamList,
  'BankCredentials'
>;

interface Props {
  navigation: BankCredentialsScreenNavigationProp;
  route: BankCredentialsScreenRouteProp;
}

const BankCredentialsScreen: React.FC<Props> = ({navigation, route}) => {
  const {bankName} = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    // Simulate Plaid integration
    setTimeout(() => {
      setIsLoading(false);

      // Mock account data
      const mockAccounts: BankAccount[] = [
        {
          id: '1',
          bankName: bankName,
          accountType: 'checking',
          accountNumberMasked: '•••• 1234',
          balance: 2450,
          isActive: true,
        },
        {
          id: '2',
          bankName: bankName,
          accountType: 'savings',
          accountNumberMasked: '•••• 5678',
          balance: 12300,
          isActive: false,
        },
      ];

      navigation.navigate('AccountSelection', {accounts: mockAccounts});
    }, 2000);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign in to</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.bankInfo}>
          <Text style={styles.bankTitle}>{bankName}</Text>
          <View style={styles.bankLogo}>
            <Text style={styles.bankInitial}>{bankName.charAt(0)}</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.continueButton, isLoading && styles.disabledButton]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text style={styles.continueText}>
              {isLoading ? 'Connecting...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <View style={styles.securityBadge}>
            <Icon name="lock" size={16} color="#6b7280" />
            <Text style={styles.securityText}>Secured by Plaid</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bankInfo: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  bankTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  bankLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  continueButton: {
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  securityText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
});

export default BankCredentialsScreen;