import React, {Suspense} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {ActivityIndicator, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {RootStackParamList} from '@/types';

const HomeScreen = React.lazy(() => import('@/screens/HomeScreen'));
const PaymentScreen = React.lazy(() => import('@/screens/PaymentScreen'));
const SettingsScreen = React.lazy(() => import('@/screens/SettingsScreen'));
const HistoryScreen = React.lazy(() => import('@/screens/HistoryScreen'));
const TipAmountScreen = React.lazy(() => import('@/screens/TipAmountScreen'));

// Onboarding screens
// Onboarding screens
const WelcomeScreen = React.lazy(() => import('@/screens/onboarding/WelcomeScreen'));
const BankIntroScreen = React.lazy(() => import('@/screens/onboarding/BankIntroScreen'));
const BankSelectionScreen = React.lazy(() => import('@/screens/onboarding/BankSelectionScreen'));
const BankCredentialsScreen = React.lazy(() => import('@/screens/onboarding/BankCredentialsScreen'));
const AccountSelectionScreen = React.lazy(() => import('@/screens/onboarding/AccountSelectionScreen'));
const PhoneVerificationScreen = React.lazy(() => import('@/screens/onboarding/PhoneVerificationScreen'));
const KYCCollectionScreen = React.lazy(() => import('@/screens/onboarding/KYCCollectionScreen'));
const NotificationPermissionScreen = React.lazy(() => import('@/screens/onboarding/NotificationPermissionScreen'));
const OnboardingCompleteScreen = React.lazy(() => import('@/screens/onboarding/OnboardingCompleteScreen'));

// Additional screens
const TransactionDetailsScreen = React.lazy(() => import('@/screens/TransactionDetailsScreen'));

const LoadingSpinner = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'History') {
            iconName = 'history';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen
        name="Home"
        component={(props: any) => (
          <Suspense fallback={<LoadingSpinner />}>
            <HomeScreen {...props} />
          </Suspense>
        )}
      />
      <Tab.Screen
        name="History"
        component={(props: any) => (
          <Suspense fallback={<LoadingSpinner />}>
            <HistoryScreen {...props} />
          </Suspense>
        )}
      />
      <Tab.Screen
        name="Settings"
        component={(props: any) => (
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsScreen {...props} />
          </Suspense>
        )}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/* Onboarding Screens */}
        <Stack.Screen
          name="Welcome"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <WelcomeScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="BankIntro"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <BankIntroScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="BankSelection"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <BankSelectionScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="BankCredentials"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <BankCredentialsScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="AccountSelection"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <AccountSelectionScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="PhoneVerification"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <PhoneVerificationScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="KYCCollection"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <KYCCollectionScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="NotificationPermission"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <NotificationPermissionScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="OnboardingComplete"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <OnboardingCompleteScreen {...props} />
            </Suspense>
          )}
        />

        {/* Main App Screens */}
        <Stack.Screen name="Home" component={TabNavigator} />
        <Stack.Screen
          name="Payment"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <PaymentScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="TipAmount"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <TipAmountScreen {...props} />
            </Suspense>
          )}
        />
        <Stack.Screen
          name="TransactionDetails"
          component={(props: any) => (
            <Suspense fallback={<LoadingSpinner />}>
              <TransactionDetailsScreen {...props} />
            </Suspense>
          )}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;