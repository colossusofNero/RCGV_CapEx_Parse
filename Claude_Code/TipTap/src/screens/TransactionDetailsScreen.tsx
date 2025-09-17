import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList, Transaction} from '@/types';
import {RouteProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TransactionDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'TransactionDetails'
>;

interface TransactionDetail extends Transaction {
  paymentMethod?: 'nfc' | 'qr_code' | 'ach_bank' | 'stripe_card';
  paymentGateway?: string;
  transactionFee?: number;
  netAmount?: number;
  merchantInfo?: {
    name: string;
    category: string;
    location?: string;
    phone?: string;
  };
  deviceInfo?: {
    deviceType: string;
    ipAddress?: string;
    userAgent?: string;
  };
  refundInfo?: {
    refundId: string;
    refundAmount: number;
    refundReason: string;
    refundDate: Date;
    status: 'pending' | 'completed' | 'failed';
  };
}

const TransactionDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TransactionDetailsScreenRouteProp>();
  const {transactionId} = route.params;

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    loadTransactionDetails();
  }, [transactionId]);

  const loadTransactionDetails = async () => {
    try {
      // In a real app, this would fetch from your backend
      const stored = await AsyncStorage.getItem('transactions');
      if (stored) {
        const transactions: Transaction[] = JSON.parse(stored);
        const foundTransaction = transactions.find(t => t.id === transactionId);

        if (foundTransaction) {
          // Enhance with additional details
          const enhanced: TransactionDetail = {
            ...foundTransaction,
            paymentMethod: foundTransaction.method,
            paymentGateway: foundTransaction.method === 'nfc' ? 'Internal NFC' : 'QR Scanner',
            transactionFee: foundTransaction.amount * 0.029, // 2.9% fee
            netAmount: foundTransaction.amount * 0.971, // Net after fee
            merchantInfo: {
              name: 'Service Provider',
              category: 'Hospitality',
              location: 'Local Business',
              phone: '+1 (555) 123-4567',
            },
            deviceInfo: {
              deviceType: 'Mobile App',
              ipAddress: '192.168.1.100',
              userAgent: 'TipTap Mobile v1.0.0',
            },
          };

          setTransaction(enhanced);
        }
      }
    } catch (error) {
      console.error('Failed to load transaction:', error);
      Alert.alert('Error', 'Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareReceipt = async () => {
    if (!transaction) return;

    const receiptText = generateReceiptText(transaction);

    try {
      await Share.share({
        message: receiptText,
        title: 'TipTap Receipt',
      });
    } catch (error) {
      console.error('Failed to share receipt:', error);
    }
  };

  const handleDownloadReceipt = () => {
    // In a real app, this would generate and download a PDF receipt
    Alert.alert(
      'Receipt Download',
      'Receipt download functionality would be implemented here. This would generate a PDF receipt and save it to the device.'
    );
  };

  const handleEmailReceipt = () => {
    if (!transaction) return;

    const emailSubject = `TipTap Receipt - Transaction ${transaction.id}`;
    const emailBody = generateReceiptText(transaction);
    const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const handleDispute = () => {
    Alert.alert(
      'Dispute Transaction',
      'Are you sure you want to dispute this transaction? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Dispute',
          style: 'destructive',
          onPress: () => initiateDispute(),
        },
      ]
    );
  };

  const initiateDispute = () => {
    // In a real app, this would start the dispute process
    Alert.alert(
      'Dispute Initiated',
      'Your dispute has been submitted. You will receive an email confirmation shortly. Our team will review your case within 3-5 business days.'
    );
  };

  const handleRefund = () => {
    Alert.alert(
      'Request Refund',
      'Are you sure you want to request a refund for this transaction?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Request Refund',
          onPress: () => processRefund(),
        },
      ]
    );
  };

  const processRefund = () => {
    // In a real app, this would process the refund
    Alert.alert(
      'Refund Requested',
      'Your refund request has been submitted. Refunds typically take 3-5 business days to appear in your account.'
    );
  };

  const generateReceiptText = (txn: TransactionDetail): string => {
    return `
TipTap Digital Receipt
=====================

Transaction ID: ${txn.id}
Date: ${new Date(txn.timestamp).toLocaleString()}
Amount: $${txn.amount.toFixed(2)}
Method: ${txn.method?.toUpperCase()}
Status: ${txn.status?.toUpperCase()}

${txn.merchantInfo ? `
Merchant: ${txn.merchantInfo.name}
Category: ${txn.merchantInfo.category}
${txn.merchantInfo.location ? `Location: ${txn.merchantInfo.location}` : ''}
` : ''}

Transaction Fee: $${(txn.transactionFee || 0).toFixed(2)}
Net Amount: $${(txn.netAmount || txn.amount).toFixed(2)}

${txn.notes ? `Notes: ${txn.notes}` : ''}

Thank you for using TipTap!
For support, contact: support@tiptap.com
    `.trim();
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'nfc':
        return 'nfc';
      case 'qr':
        return 'qr-code';
      case 'stripe_card':
        return 'credit-card';
      case 'ach_bank':
        return 'account-balance';
      default:
        return 'payment';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transaction details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Transaction Not Found</Text>
          <Text style={styles.errorText}>
            The requested transaction could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {date, time} = formatTimestamp(transaction.timestamp);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity onPress={handleShareReceipt}>
          <Icon name="share" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transaction Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon
              name={getStatusIcon(transaction.status)}
              size={32}
              color={getStatusColor(transaction.status)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusAmount}>
                ${transaction.amount.toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.statusText,
                  {color: getStatusColor(transaction.status)},
                ]}
              >
                {transaction.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.statusDetails}>
            <Text style={styles.transactionId}>ID: {transaction.id}</Text>
            <Text style={styles.transactionDate}>{date}</Text>
            <Text style={styles.transactionTime}>{time}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <Icon name="payment" size={24} color="#6b7280" />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>
          <View style={styles.methodInfo}>
            <Icon
              name={getMethodIcon(transaction.method)}
              size={20}
              color="#1f2937"
            />
            <Text style={styles.methodText}>
              {transaction.paymentMethod?.toUpperCase().replace('_', ' ') ||
               transaction.method?.toUpperCase()}
            </Text>
          </View>
          {transaction.paymentGateway && (
            <Text style={styles.gatewayText}>
              via {transaction.paymentGateway}
            </Text>
          )}
        </View>

        {/* Amount Breakdown */}
        <View style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <Icon name="receipt" size={24} color="#6b7280" />
            <Text style={styles.cardTitle}>Amount Breakdown</Text>
          </View>
          <View style={styles.amountBreakdown}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Tip Amount</Text>
              <Text style={styles.amountValue}>
                ${transaction.amount.toFixed(2)}
              </Text>
            </View>
            {transaction.transactionFee && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Transaction Fee</Text>
                <Text style={styles.amountValue}>
                  -${transaction.transactionFee.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.amountRow}>
              <Text style={styles.totalLabel}>Net Amount</Text>
              <Text style={styles.totalValue}>
                ${(transaction.netAmount || transaction.amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Merchant Information */}
        {transaction.merchantInfo && (
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Icon name="store" size={24} color="#6b7280" />
              <Text style={styles.cardTitle}>Merchant Details</Text>
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>
                {transaction.merchantInfo.name}
              </Text>
              <Text style={styles.merchantCategory}>
                {transaction.merchantInfo.category}
              </Text>
              {transaction.merchantInfo.location && (
                <View style={styles.merchantLocation}>
                  <Icon name="location-on" size={16} color="#6b7280" />
                  <Text style={styles.merchantLocationText}>
                    {transaction.merchantInfo.location}
                  </Text>
                </View>
              )}
              {transaction.merchantInfo.phone && (
                <View style={styles.merchantPhone}>
                  <Icon name="phone" size={16} color="#6b7280" />
                  <Text style={styles.merchantPhoneText}>
                    {transaction.merchantInfo.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {transaction.notes && (
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Icon name="note" size={24} color="#6b7280" />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{transaction.notes}</Text>
          </View>
        )}

        {/* Technical Details */}
        <TouchableOpacity
          style={styles.detailCard}
          onPress={() => setShowRawData(!showRawData)}
        >
          <View style={styles.cardHeader}>
            <Icon name="code" size={24} color="#6b7280" />
            <Text style={styles.cardTitle}>Technical Details</Text>
            <Icon
              name={showRawData ? 'expand-less' : 'expand-more'}
              size={24}
              color="#6b7280"
            />
          </View>
          {showRawData && (
            <View style={styles.technicalDetails}>
              {transaction.deviceInfo && (
                <>
                  <View style={styles.techRow}>
                    <Text style={styles.techLabel}>Device:</Text>
                    <Text style={styles.techValue}>
                      {transaction.deviceInfo.deviceType}
                    </Text>
                  </View>
                  {transaction.deviceInfo.ipAddress && (
                    <View style={styles.techRow}>
                      <Text style={styles.techLabel}>IP Address:</Text>
                      <Text style={styles.techValue}>
                        {transaction.deviceInfo.ipAddress}
                      </Text>
                    </View>
                  )}
                </>
              )}
              <View style={styles.techRow}>
                <Text style={styles.techLabel}>Transaction Hash:</Text>
                <Text style={styles.techValue} numberOfLines={1} ellipsizeMode="middle">
                  {transaction.id.replace(/[^a-f0-9]/g, '').slice(0, 32)}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Text style={styles.actionSectionTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEmailReceipt}
          >
            <Icon name="email" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Email Receipt</Text>
            <Icon name="chevron-right" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownloadReceipt}
          >
            <Icon name="download" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Download PDF Receipt</Text>
            <Icon name="chevron-right" size={20} color="#6b7280" />
          </TouchableOpacity>

          {transaction.status === 'completed' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRefund}
            >
              <Icon name="undo" size={20} color="#f59e0b" />
              <Text style={styles.actionButtonText}>Request Refund</Text>
              <Icon name="chevron-right" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerAction]}
            onPress={handleDispute}
          >
            <Icon name="report-problem" size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Dispute Transaction
            </Text>
            <Icon name="chevron-right" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  statusDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  transactionId: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  transactionDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 4,
  },
  transactionTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 8,
    fontWeight: '500',
  },
  gatewayText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 28,
  },
  amountBreakdown: {
    gap: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  amountValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  merchantInfo: {
    gap: 8,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  merchantCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  merchantLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  merchantLocationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  merchantPhone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantPhoneText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  notesText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  technicalDetails: {
    gap: 8,
    paddingTop: 8,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  techLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  techValue: {
    fontSize: 14,
    color: '#1f2937',
    fontFamily: 'monospace',
    flex: 2,
    textAlign: 'right',
  },
  actionSection: {
    marginTop: 32,
    marginBottom: 40,
  },
  actionSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  dangerAction: {
    borderColor: '#fecaca',
  },
  dangerText: {
    color: '#ef4444',
  },
});

export default TransactionDetailsScreen;