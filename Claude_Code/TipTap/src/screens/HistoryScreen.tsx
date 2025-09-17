import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppContext} from '@/context/AppContext';
import {Transaction} from '@/types';
import {PaymentService} from '@/services/PaymentService';

const HistoryScreen = () => {
  const {state, dispatch} = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const storedTransactions = await PaymentService.getStoredTransactions();
      dispatch({type: 'SET_TRANSACTIONS', payload: storedTransactions});
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const transactionDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (transactionDate >= today) {
      return `Today, ${transactionDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (transactionDate >= yesterday) {
      return `Yesterday, ${transactionDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      return transactionDate.toLocaleString();
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <Icon name="check-circle" size={20} color="#34C759" />;
      case 'pending':
        return <Icon name="schedule" size={20} color="#FF9500" />;
      case 'failed':
        return <Icon name="error" size={20} color="#FF3B30" />;
      default:
        return <Icon name="help" size={20} color="#8E8E93" />;
    }
  };

  const getMethodIcon = (method: Transaction['method']) => {
    return method === 'nfc' ? (
      <Icon name="nfc" size={24} color="#007AFF" />
    ) : (
      <Icon name="qr-code" size={24} color="#34C759" />
    );
  };

  const renderTransaction = ({item}: {item: Transaction}) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {getMethodIcon(item.method)}
      </View>

      <View style={styles.transactionInfo}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionAmount}>
            ${item.amount.toFixed(2)} {item.currency}
          </Text>
          {getStatusIcon(item.status)}
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionMethod}>
            {item.method.toUpperCase()} Payment
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.timestamp)}
          </Text>
        </View>

        {item.notes && (
          <Text style={styles.transactionNotes}>{item.notes}</Text>
        )}

        {item.recipient && (
          <Text style={styles.transactionRecipient}>To: {item.recipient}</Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="history" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyMessage}>
        Your tip transactions will appear here once you make your first payment.
      </Text>
    </View>
  );

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const grouped: {[key: string]: Transaction[]} = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const dateKey = date.toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    return Object.entries(grouped).map(([date, transactions]) => ({
      date,
      transactions: transactions.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    }));
  };

  const groupedTransactions = groupTransactionsByDate(state.transactions);

  const totalAmount = state.transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        {state.transactions.length > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Tipped</Text>
            <Text style={styles.totalAmount}>
              ${totalAmount.toFixed(2)} {state.settings.currency}
            </Text>
          </View>
        )}
      </View>

      {state.transactions.length === 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={groupedTransactions}
          keyExtractor={item => item.date}
          renderItem={({item}) => (
            <View style={styles.dateSection}>
              <Text style={styles.dateHeader}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              {item.transactions.map(transaction => (
                <View key={transaction.id}>
                  {renderTransaction({item: transaction})}
                </View>
              ))}
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  totalContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  transactionItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionMethod: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  transactionRecipient: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HistoryScreen;