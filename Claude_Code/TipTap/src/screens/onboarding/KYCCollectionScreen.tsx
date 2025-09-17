import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList} from '@/types';

type KYCCollectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'KYCCollection'
>;

interface Props {
  navigation: KYCCollectionScreenNavigationProp;
}

interface KYCForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssn: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

const KYCCollectionScreen: React.FC<Props> = ({navigation}) => {
  const [form, setForm] = useState<KYCForm>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ssn: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const updateForm = (field: keyof KYCForm, value: string) => {
    setForm(prev => ({...prev, [field]: value}));
  };

  const formatSSN = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{2})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const formatDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (match) {
      return `${match[1]}/${match[2]}/${match[3]}`;
    }
    return cleaned;
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'ssn',
      'street',
      'city',
      'state',
      'zipCode',
    ];

    for (const field of requiredFields) {
      if (!form[field as keyof KYCForm].trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return false;
      }
    }

    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate KYC submission
    setTimeout(() => {
      setIsLoading(false);
      // TODO: Save KYC data
      navigation.navigate('NotificationPermission');
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
        <Text style={styles.headerTitle}>Verify Identity</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.sectionDescription}>
            We need to verify your identity for security and compliance purposes.
          </Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={form.firstName}
                onChangeText={(value) => updateForm('firstName', value)}
                placeholder="John"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={form.lastName}
                onChangeText={(value) => updateForm('lastName', value)}
                placeholder="Doe"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <TextInput
              style={styles.input}
              value={formatDate(form.dateOfBirth)}
              onChangeText={(value) => updateForm('dateOfBirth', value)}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Social Security Number *</Text>
            <TextInput
              style={styles.input}
              value={formatSSN(form.ssn)}
              onChangeText={(value) => updateForm('ssn', value)}
              placeholder="123-45-6789"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              secureTextEntry
              maxLength={11}
            />
          </View>

          <Text style={[styles.sectionTitle, styles.addressTitle]}>Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address *</Text>
            <TextInput
              style={styles.input}
              value={form.street}
              onChangeText={(value) => updateForm('street', value)}
              placeholder="123 Main Street"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                value={form.city}
                onChangeText={(value) => updateForm('city', value)}
                placeholder="New York"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={[styles.inputGroup, styles.quarterWidth]}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={styles.input}
                value={form.state}
                onChangeText={(value) => updateForm('state', value.toUpperCase())}
                placeholder="NY"
                placeholderTextColor="#9ca3af"
                maxLength={2}
              />
            </View>

            <View style={[styles.inputGroup, styles.quarterWidth]}>
              <Text style={styles.inputLabel}>ZIP Code *</Text>
              <TextInput
                style={styles.input}
                value={form.zipCode}
                onChangeText={(value) => updateForm('zipCode', value)}
                placeholder="10001"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={styles.checkbox}>
              {termsAccepted && (
                <Icon name="check" size={16} color="#007AFF" />
              )}
            </View>
            <Text style={styles.termsText}>
              I accept the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Verifying...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Icon name="security" size={16} color="#6b7280" />
            <Text style={styles.securityText}>
              Your information is encrypted and secure
            </Text>
          </View>
        </View>
      </ScrollView>
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
  },
  formContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  addressTitle: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  quarterWidth: {
    width: '30%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 32,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  securityText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
});

export default KYCCollectionScreen;