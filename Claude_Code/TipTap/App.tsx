import React from 'react';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {ActivityIndicator, View} from 'react-native';
import {store, persistor} from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineManager from './src/components/OfflineManager';
import CacheManager from './src/components/CacheManager';
import {SecurityProvider} from './src/components/SecurityProvider';

const LoadingView = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        <SecurityProvider>
          <OfflineManager />
          <CacheManager />
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <AppNavigator />
        </SecurityProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;