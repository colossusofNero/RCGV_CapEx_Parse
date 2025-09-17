import React, {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {AppState} from 'react-native';
import {clearExpiredEntries} from '../store/slices/cacheSlice';

const CacheManager: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const clearExpired = () => {
      dispatch(clearExpiredEntries());
    };

    clearExpired();

    const interval = setInterval(clearExpired, 5 * 60 * 1000);

    const handleAppStateChange = (nextAppState: any) => {
      if (nextAppState === 'active') {
        clearExpired();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, [dispatch]);

  return null;
};

export default CacheManager;