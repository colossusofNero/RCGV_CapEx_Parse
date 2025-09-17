import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList} from '@/types';

type NotificationPermissionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'NotificationPermission'
>;

interface Props {
  navigation: NotificationPermissionScreenNavigationProp;
}

const NotificationPermissionScreen: React.FC<Props> = ({navigation}) => {
  const [isLoading, setIsLoading] = useState(false);

  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'TipTap needs notification permission to keep you updated about your transactions.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // For iOS, you would use @react-native-async-storage/async-storage
        // and PushNotificationIOS or @react-native-community/push-notification-ios
        return true; // Simulate permission granted
      }
    } catch (error) {
      console.warn(error);
      return false;
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);

    const permissionGranted = await requestNotificationPermission();

    setTimeout(() => {
      setIsLoading(false);

      if (permissionGranted) {
        // TODO: Save notification preference
        navigation.navigate('OnboardingComplete');
      } else {
        Alert.alert(
          'Permission Denied',
          'You can enable notifications later in Settings.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OnboardingComplete'),
            },
          ]
        );
      }
    }, 1000);
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingComplete');
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
        <Text style={styles.headerTitle}>Stay Updated</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.bellIcon}>
            <Icon name="notifications" size={40} color="#007AFF" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Get Notifications</Text>
          <Text style={styles.description}>
            Stay informed about{'\n'}your transactions and{'\n'}received tips
          </Text>
        </View>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Transaction receipts</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Tip notifications</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Security alerts</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.enableButton, isLoading && styles.disabledButton]}
            onPress={handleEnableNotifications}
            disabled={isLoading}
          >
            <Text style={styles.enableButtonText}>
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  bellIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsList: {
    marginTop: 40,
    marginBottom: 60,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  enableButton: {
    height: 56,
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
  enableButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default NotificationPermissionScreen;