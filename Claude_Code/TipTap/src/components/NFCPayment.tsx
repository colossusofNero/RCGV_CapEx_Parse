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
import HapticFeedback from 'react-native-haptic-feedback';

interface NFCPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onFallbackToQR?: () => void;
}

const NFCPayment: React.FC<NFCPaymentProps> = ({amount, onSuccess, onError, onFallbackToQR}) => {
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(3);
  const [showTimeout, setShowTimeout] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkNfcSupport();
    return () => {
      cleanupTimers();
      NfcManager.cancelTechnologyRequest().catch(() => 0);
    };
  }, []);

  const cleanupTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const triggerHapticFeedback = (type: 'success' | 'warning' | 'error' | 'impact') => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };

    switch (type) {
      case 'success':
        HapticFeedback.trigger('notificationSuccess', options);
        break;
      case 'warning':
        HapticFeedback.trigger('notificationWarning', options);
        break;
      case 'error':
        HapticFeedback.trigger('notificationError', options);
        break;
      case 'impact':
        HapticFeedback.trigger('impactMedium', options);
        break;
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
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
    ).start();
  };

  const startScaleAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    scaleAnim.stopAnimation();
    pulseAnim.setValue(1);
    scaleAnim.setValue(1);
  };

  const startTimeout = () => {
    setShowTimeout(true);
    setTimeoutSeconds(3);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setTimeoutSeconds(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    cleanupTimers();
    setShowTimeout(false);
    setIsReading(false);
    stopAnimations();
    triggerHapticFeedback('warning');

    Alert.alert(
      'NFC Timeout',
      'Unable to detect NFC payment terminal. Would you like to try QR code instead?',
      [
        {
          text: 'Try Again',
          onPress: () => {
            triggerHapticFeedback('impact');
            startNfcReading();
          }
        },
        {
          text: 'Use QR Code',
          onPress: () => {
            if (onFallbackToQR) {
              triggerHapticFeedback('impact');
              onFallbackToQR();
            }
          }
        }
      ]
    );
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

  const startNfcReading = async () => {
    try {
      setIsReading(true);
      startPulseAnimation();
      startScaleAnimation();
      startTimeout();
      triggerHapticFeedback('impact');

      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();

      if (tag) {
        cleanupTimers();
        stopAnimations();
        setShowTimeout(false);
        triggerHapticFeedback('success');

        // Simulate payment processing with visual feedback
        const transactionId = `nfc_${Date.now()}`;
        await new Promise(resolve => setTimeout(resolve, 2000));

        onSuccess(transactionId);
      } else {
        cleanupTimers();
        stopAnimations();
        setShowTimeout(false);
        triggerHapticFeedback('error');
        onError('No NFC tag detected');
      }
    } catch (ex) {
      console.warn('NFC Reading Error:', ex);
      cleanupTimers();
      stopAnimations();
      setShowTimeout(false);
      setIsReading(false);
      triggerHapticFeedback('error');
      onError('Failed to read NFC tag');
    } finally {
      if (!showTimeout) {
        setIsReading(false);
        NfcManager.cancelTechnologyRequest().catch(() => 0);
      }
    }
  };

  const cancelReading = () => {
    cleanupTimers();
    stopAnimations();
    setIsReading(false);
    setShowTimeout(false);
    triggerHapticFeedback('impact');
    NfcManager.cancelTechnologyRequest().catch(() => 0);
  };

  if (!isNfcSupported) {
    return (
      <View style={styles.container}>
        <Icon name="error" size={64} color="#FF6B6B" />
        <Text style={styles.errorTitle}>NFC Not Available</Text>
        <Text style={styles.errorText}>
          Your device doesn't support NFC or it's disabled. Please enable NFC in your device settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isReading ? (
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.pulseContainer,
              {
                transform: [{scale: pulseAnim}],
              },
            ]}
          >
            <View style={styles.nfcCircle}>
              <Animated.View
                style={[
                  styles.nfcIconContainer,
                  {
                    transform: [{scale: scaleAnim}],
                  },
                ]
              }
              >
                <Icon name="nfc" size={60} color="#007AFF" />
              </Animated.View>
            </View>
          </Animated.View>

          {/* Lottie animation for scanning effect */}
          <View style={styles.lottieContainer}>
            <View style={styles.scanningWaves}>
              <View style={[styles.wave, styles.wave1]} />
              <View style={[styles.wave, styles.wave2]} />
              <View style={[styles.wave, styles.wave3]} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.nfcIconStatic}>
          <Icon name="nfc" size={80} color="#ccc" />
        </View>
      )}

      <Text style={styles.title}>
        {isReading
          ? 'Hold your device near the payment terminal'
          : 'Ready for NFC Payment'}
      </Text>

      <Text style={styles.instruction}>
        {isReading
          ? 'Keep your device steady until payment is complete'
          : `Tap the button below to pay $${amount.toFixed(2)} via NFC`}
      </Text>

      {showTimeout && (
        <View style={styles.timeoutContainer}>
          <Text style={styles.timeoutText}>
            Timeout in {timeoutSeconds} second{timeoutSeconds !== 1 ? 's' : ''}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(timeoutSeconds / 3) * 100}%` }
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isReading ? (
          <>
            <TouchableOpacity
              style={styles.payButton}
              onPress={startNfcReading}
            >
              <Icon name="nfc" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.payButtonText}>Start NFC Payment</Text>
            </TouchableOpacity>

            {onFallbackToQR && (
              <TouchableOpacity
                style={styles.qrFallbackButton}
                onPress={() => {
                  triggerHapticFeedback('impact');
                  onFallbackToQR();
                }}
              >
                <Icon name="qr-code" size={20} color="#007AFF" style={styles.buttonIcon} />
                <Text style={styles.qrFallbackText}>Use QR Code Instead</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelReading}>
            <Icon name="close" size={24} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {isReading && (
        <View style={styles.readingIndicator}>
          <View style={styles.readingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
          <Text style={styles.readingText}>Scanning for NFC device...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  animationContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  nfcIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcIconStatic: {
    marginBottom: 30,
  },
  lottieContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningWaves: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.4)',
  },
  wave1: {
    width: 140,
    height: 140,
    animation: 'pulse 2s infinite ease-out',
    animationDelay: '0s',
  },
  wave2: {
    width: 170,
    height: 170,
    animation: 'pulse 2s infinite ease-out',
    animationDelay: '0.6s',
  },
  wave3: {
    width: 200,
    height: 200,
    animation: 'pulse 2s infinite ease-out',
    animationDelay: '1.2s',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  timeoutContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  timeoutText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  qrFallbackButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  qrFallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#FF6B6B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 8,
  },
  readingIndicator: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  readingDots: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginHorizontal: 3,
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 0.4,
  },
  readingText: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 20,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NFCPayment;