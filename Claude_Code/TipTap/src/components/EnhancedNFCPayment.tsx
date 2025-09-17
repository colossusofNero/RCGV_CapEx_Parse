import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Vibration,
} from 'react-native';
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface EnhancedNFCPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onFallbackToQR: () => void;
}

const TIMEOUT_DURATION = 30000; // 30 seconds
const ANIMATION_DURATION = 3000; // 3 seconds for animation

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const EnhancedNFCPayment: React.FC<EnhancedNFCPaymentProps> = ({
  amount,
  onSuccess,
  onError,
  onFallbackToQR,
}) => {
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [countdown, setCountdown] = useState(TIMEOUT_DURATION / 1000);
  const [showAnimation, setShowAnimation] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkNfcSupport();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isReading) {
      startPulseAnimation();
      startCountdown();
    } else {
      stopAnimations();
    }
  }, [isReading]);

  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    NfcManager.cancelTechnologyRequest().catch(() => 0);
  };

  const checkNfcSupport = async () => {
    try {
      const supported = await NfcManager.isSupported();
      setIsNfcSupported(supported);
      if (supported) {
        await NfcManager.start();
      }
    } catch (ex) {
      console.warn('NFC Error:', ex);
      setIsNfcSupported(false);
    }
  };

  const startPulseAnimation = () => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  };

  const startSuccessAnimation = () => {
    setShowAnimation(true);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Success haptic
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startCountdown = () => {
    setCountdown(TIMEOUT_DURATION / 1000);

    // Set main timeout
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, TIMEOUT_DURATION);

    // Update countdown every second
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    setIsReading(false);
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
    Alert.alert(
      'NFC Timeout',
      'NFC scanning timed out. Would you like to try again or use QR code instead?',
      [
        {text: 'Try Again', onPress: () => startNfcReading()},
        {text: 'Use QR Code', onPress: onFallbackToQR},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  const startNfcReading = async () => {
    try {
      setIsReading(true);
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);

      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();

      if (tag) {
        startSuccessAnimation();

        // Simulate payment processing
        const transactionId = `nfc_${Date.now()}`;
        await new Promise(resolve => setTimeout(resolve, 2000));

        cleanup();
        onSuccess(transactionId);
      } else {
        onError('No NFC tag detected');
      }
    } catch (ex) {
      console.warn('NFC Reading Error:', ex);
      ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
      onError('Failed to read NFC tag');
    } finally {
      setIsReading(false);
      cleanup();
    }
  };

  const cancelReading = () => {
    setIsReading(false);
    cleanup();
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  };

  if (!isNfcSupported) {
    return (
      <View style={styles.container}>
        <Icon name="error" size={64} color="#FF6B6B" />
        <Text style={styles.errorTitle}>NFC Not Available</Text>
        <Text style={styles.errorText}>
          Your device doesn't support NFC or it's disabled.
        </Text>
        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={onFallbackToQR}
        >
          <Icon name="qr-code" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.fallbackButtonText}>Use QR Code Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        {showAnimation ? (
          <LottieView
            source={require('../assets/animations/nfc-success.json')}
            style={styles.lottieAnimation}
            autoPlay
            loop={false}
            onAnimationFinish={() => setShowAnimation(false)}
          />
        ) : (
          <Animated.View
            style={[
              styles.nfcIconContainer,
              {
                transform: [{scale: isReading ? pulseAnim : scaleAnim}],
              },
            ]}
          >
            {isReading ? (
              <LottieView
                source={require('../assets/animations/nfc-scanning.json')}
                style={styles.scanningAnimation}
                autoPlay
                loop
              />
            ) : (
              <Icon
                name="nfc"
                size={80}
                color="#007AFF"
                style={styles.nfcIcon}
              />
            )}
          </Animated.View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {isReading
            ? 'Hold your device near the payment terminal'
            : 'Ready for NFC Payment'}
        </Text>

        <Text style={styles.amount}>${amount.toFixed(2)}</Text>

        {isReading && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              Timeout in {countdown}s
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${(countdown / (TIMEOUT_DURATION / 1000)) * 100}%`},
                ]}
              />
            </View>
          </View>
        )}

        <Text style={styles.instruction}>
          {isReading
            ? 'Keep your device steady and close to the terminal'
            : 'Tap the button below to start NFC payment'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {!isReading ? (
          <>
            <TouchableOpacity
              style={styles.payButton}
              onPress={startNfcReading}
              activeOpacity={0.8}
            >
              <Icon name="nfc" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.payButtonText}>Start NFC Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qrButton}
              onPress={onFallbackToQR}
              activeOpacity={0.8}
            >
              <Icon name="qr-code" size={20} color="#007AFF" style={styles.buttonIcon} />
              <Text style={styles.qrButtonText}>Use QR Code Instead</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelReading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#ffffff',
  },
  animationContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nfcIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nfcIcon: {
    opacity: 0.8,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  scanningAnimation: {
    width: 100,
    height: 100,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 24,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  countdownText: {
    fontSize: 16,
    color: '#f59e0b',
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
  instruction: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  qrButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  fallbackButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  fallbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 8,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
});

export default EnhancedNFCPayment;