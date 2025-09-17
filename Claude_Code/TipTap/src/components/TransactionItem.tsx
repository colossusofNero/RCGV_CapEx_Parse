import React, {memo, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Transaction} from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem = memo<TransactionItemProps>(({transaction}) => {
  const formattedDate = useMemo(() => {
    const transactionDate = new Date(transaction.timestamp);
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
  }, [transaction.timestamp]);

  const statusIcon = useMemo(() => {
    switch (transaction.status) {
      case 'completed':
        return <Icon name="check-circle" size={20} color="#34C759" />;
      case 'pending':
        return <Icon name="schedule" size={20} color="#FF9500" />;
      case 'failed':
        return <Icon name="error" size={20} color="#FF3B30" />;
      default:
        return <Icon name="help" size={20} color="#8E8E93" />;
    }
  }, [transaction.status]);

  const methodIcon = useMemo(() => {
    return transaction.method === 'nfc' ? (
      <Icon name="nfc" size={24} color="#007AFF" />
    ) : (
      <Icon name="qr-code" size={24} color="#34C759" />
    );
  }, [transaction.method]);

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {methodIcon}
      </View>

      <View style={styles.transactionInfo}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionAmount}>
            ${transaction.amount.toFixed(2)} {transaction.currency}
          </Text>
          {statusIcon}
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionMethod}>
            {transaction.method.toUpperCase()} Payment
          </Text>
          <Text style={styles.transactionDate}>
            {formattedDate}
          </Text>
        </View>

        {transaction.notes && (
          <Text style={styles.transactionNotes}>{transaction.notes}</Text>
        )}

        {transaction.recipient && (
          <Text style={styles.transactionRecipient}>To: {transaction.recipient}</Text>
        )}
      </View>
    </View>
  );
});

TransactionItem.displayName = 'TransactionItem';

const styles = StyleSheet.create({
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
});

export default TransactionItem;