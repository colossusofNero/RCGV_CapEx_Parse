import React, {useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {useDispatch, useSelector} from 'react-redux';
import {setOnlineStatus, setProcessing, removeFromQueue, incrementRetryCount} from '../store/slices/offlineSlice';
import {RootState} from '../store';
import {useProcessPaymentMutation} from '../store/api/paymentApi';

const OfflineManager: React.FC = () => {
  const dispatch = useDispatch();
  const {isOnline, queue, isProcessing} = useSelector((state: RootState) => state.offline);
  const [processPayment] = useProcessPaymentMutation();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? false;

      dispatch(setOnlineStatus(isNowOnline));

      if (wasOffline && isNowOnline && queue.length > 0 && !isProcessing) {
        processOfflineQueue();
      }
    });

    return unsubscribe;
  }, [isOnline, queue.length, isProcessing]);

  const processOfflineQueue = async () => {
    if (isProcessing) return;

    dispatch(setProcessing(true));

    for (const action of queue) {
      try {
        if (action.type === 'PAYMENT') {
          await processPayment(action.payload).unwrap();
          dispatch(removeFromQueue(action.id));
        }
      } catch (error) {
        console.warn('Failed to process offline action:', error);
        dispatch(incrementRetryCount(action.id));

        if (action.retryCount >= action.maxRetries) {
          dispatch(removeFromQueue(action.id));
        }
      }
    }

    dispatch(setProcessing(false));
  };

  return null;
};

export default OfflineManager;