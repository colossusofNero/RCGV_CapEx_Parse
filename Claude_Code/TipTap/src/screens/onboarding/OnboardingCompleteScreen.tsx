import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList} from '@/types';

type OnboardingCompleteScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OnboardingComplete'
>;

interface Props {
  navigation: OnboardingCompleteScreenNavigationProp;
}

const OnboardingCompleteScreen: React.FC<Props> = ({navigation}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the checkmark icon
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate after 3 seconds
    const timer = setTimeout(() => {
      handleStartTipping();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartTipping = () => {
    // TODO: Mark onboarding as complete in storage
    // TODO: Update user state
    navigation.reset({
      index: 0,
      routes: [{name: 'Home'}],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.checkmarkCircle,
              {transform: [{scale: scaleAnim}]},
            ]}
          >
            <Icon name="check" size={60} color="#ffffff" />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textContainer, {opacity: fadeAnim}]}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.description}>
            Your TipTap account{'\n'}is ready to use
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, {opacity: fadeAnim}]}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTipping}
          >
            <Text style={styles.startButtonText}>Start Tipping</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Continuing automatically in 3 seconds...</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 60,
  },
  startButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#10b981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  timerContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default OnboardingCompleteScreen;