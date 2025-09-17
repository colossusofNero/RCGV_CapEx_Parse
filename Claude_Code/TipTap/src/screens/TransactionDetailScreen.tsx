import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList} from '@/types';
import {captureRef} from 'react-native-view-shot';

type TransactionDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TransactionDetail'
>;

type TransactionDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'TransactionDetail'
>;

interface Props {
  navigation: TransactionDetailScreenNavigationProp;
  route: TransactionDetailScreenRouteProp;
}

interface Transaction {
  id: string;
  amount: number;
  recipient: {
    name: string;
    serviceType: string;
    location: string;
  };
  timestamp: number;
  status: 'completed' | 'pending' | 'failed' | 'disputed';
  paymentMethod: 'nfc' | 'qr';
  transactionFee: number;
  category: string;
  receiptNumber: string;
  notes?: string;
}

const TransactionDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const {transaction: initialTransaction} = route.params as {transaction: Transaction};
  const [transaction, setTransaction] = useState<Transaction>(initialTransaction);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const receiptRef = useRef<View>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return '#34c759';
      case 'pending':
        return '#ff9500';
      case 'failed':
        return '#ff3b30';
      case 'disputed':
        return '#ff9500';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'failed':
        return 'error';
      case 'disputed':
        return 'gavel';
      default:
        return 'info';
    }
  };

  const generateReceipt = async () => {
    setIsGeneratingReceipt(true);
    try {
      if (receiptRef.current) {
        const uri = await captureRef(receiptRef.current, {
          format: 'png',
          quality: 1,
        });

        await Share.share({
          url: uri,
          title: `TipTap Receipt - ${transaction.receiptNumber}`,
          message: `Transaction Receipt\nAmount: $${transaction.amount.toFixed(2)}\nRecipient: ${transaction.recipient.name}\nDate: ${formatDate(transaction.timestamp).date}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const shareTransaction = async () => {
    const formatted = formatDate(transaction.timestamp);
    const message = `TipTap Transaction\n\nAmount: $${transaction.amount.toFixed(2)}\nRecipient: ${transaction.recipient.name}\nService: ${transaction.recipient.serviceType}\nLocation: ${transaction.recipient.location}\nDate: ${formatted.date}\nTime: ${formatted.time}\nReceipt #: ${transaction.receiptNumber}`;

    try {
      await Share.share({
        message,
        title: 'Transaction Details',
      });
    } catch (error) {
      console.warn('Error sharing transaction:', error);
    }
  };

  const handleDispute = () => {
    setShowDisputeModal(true);
  };

  const submitDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert('Missing Information', 'Please select a dispute reason.');
      return;
    }

    if (!disputeDescription.trim()) {
      Alert.alert('Missing Information', 'Please provide a description of the issue.');
      return;
    }

    try {
      // Simulate dispute submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      setTransaction(prev => ({...prev, status: 'disputed'}));
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeDescription('');

      Alert.alert(
        'Dispute Submitted',
        'Your dispute has been submitted and will be reviewed within 1-2 business days. You will receive updates via email.',
        [{text: 'OK'}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit dispute. Please try again.');
    }
  };

  const exportToPDF = async () => {
    // This would integrate with a PDF generation library
    Alert.alert(
      'Export to PDF',
      'PDF export functionality will be available in the next update.',
      [{text: 'OK'}]
    );
  };

  const exportToCSV = async () => {
    // This would generate CSV data
    const csvData = [
      'Date,Time,Amount,Recipient,Service Type,Location,Status,Receipt Number,Payment Method',
      `${formatDate(transaction.timestamp).date},${formatDate(transaction.timestamp).time},$${transaction.amount.toFixed(2)},${transaction.recipient.name},${transaction.recipient.serviceType},${transaction.recipient.location},${transaction.status},${transaction.receiptNumber},${transaction.paymentMethod.toUpperCase()}`
    ].join('\n');

    try {
      await Share.share({
        message: csvData,
        title: 'Transaction CSV Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export CSV. Please try again.');
    }
  };

  const formatted = formatDate(transaction.timestamp);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={shareTransaction}>
          <Icon name="share" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt View for Sharing */}
        <View ref={receiptRef} style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>TipTap Receipt</Text>
            <Text style={styles.receiptNumber}>#{transaction.receiptNumber}</Text>
          </View>

          {/* Transaction Status */}
          <View style={styles.statusSection}>
            <View style={styles.statusBadge}>
              <Icon
                name={getStatusIcon(transaction.status)}
                size={20}
                color={getStatusColor(transaction.status)}
              />
              <Text style={[styles.statusText, {color: getStatusColor(transaction.status)}]}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Tip Amount</Text>
            <Text style={styles.amountValue}>${transaction.amount.toFixed(2)}</Text>
          </View>

          {/* Recipient Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Recipient Details</Text>
            <View style={styles.infoRow}>
              <Icon name="person" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Service Provider</Text>
                <Text style={styles.infoValue}>{transaction.recipient.name}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="work" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Service Type</Text>
                <Text style={styles.infoValue}>{transaction.recipient.serviceType}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{transaction.recipient.location}</Text>
              </View>
            </View>
          </View>

          {/* Transaction Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            <View style={styles.infoRow}>
              <Icon name="schedule" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{formatted.date}</Text>
                <Text style={styles.infoValue}>{formatted.time}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name={transaction.paymentMethod === 'nfc' ? 'nfc' : 'qr-code'} size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>
                  {transaction.paymentMethod === 'nfc' ? 'NFC Payment' : 'QR Code'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="receipt" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Receipt Number</Text>
                <Text style={styles.infoValue}>{transaction.receiptNumber}</Text>
              </View>
            </View>
            {transaction.transactionFee > 0 && (
              <View style={styles.infoRow}>
                <Icon name="attach-money" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Transaction Fee</Text>
                  <Text style={styles.infoValue}>${transaction.transactionFee.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={generateReceipt}
            disabled={isGeneratingReceipt}
          >
            <Icon name="receipt" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>
              {isGeneratingReceipt ? 'Generating...' : 'Generate Receipt'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={exportToPDF}>
            <Icon name="picture-as-pdf" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Export to PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={exportToCSV}>
            <Icon name="table-chart" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Export to CSV</Text>
          </TouchableOpacity>

          {transaction.status === 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.disputeButton]}
              onPress={handleDispute}
            >
              <Icon name="gavel" size={20} color="#ff9500" />
              <Text style={[styles.actionButtonText, styles.disputeButtonText]}>
                Dispute Transaction
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {transaction.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{transaction.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Dispute Modal */}
      <Modal
        visible={showDisputeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.disputeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispute Transaction</Text>
              <TouchableOpacity onPress={() => setShowDisputeModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.disputeContent}>
              <Text style={styles.disputeInfo}>
                Please provide details about why you're disputing this transaction. Our team will review your case within 1-2 business days.
              </Text>

              <View style={styles.disputeSection}>
                <Text style={styles.disputeLabel}>Reason for Dispute *</Text>
                <View style={styles.reasonOptions}>
                  {[
                    'Service not provided',
                    'Poor service quality',
                    'Unauthorized transaction',
                    'Incorrect amount',
                    'Other'
                  ].map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonOption,
                        disputeReason === reason && styles.selectedReason
                      ]}
                      onPress={() => setDisputeReason(reason)}
                    >
                      <Text style={[
                        styles.reasonText,
                        disputeReason === reason && styles.selectedReasonText
                      ]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.disputeSection}>
                <Text style={styles.disputeLabel}>Description *</Text>
                <TextInput
                  style={styles.disputeTextArea}
                  placeholder="Please provide additional details about your dispute..."
                  value={disputeDescription}
                  onChangeText={setDisputeDescription}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.charCount}>
                  {disputeDescription.length}/500 characters
                </Text>
              </View>
            </ScrollView>

            <View style={styles.disputeActions}>
              <TouchableOpacity
                style={styles.cancelDisputeButton}
                onPress={() => setShowDisputeModal(false)}
              >
                <Text style={styles.cancelDisputeText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitDisputeButton}
                onPress={submitDispute}
              >
                <Text style={styles.submitDisputeText}>Submit Dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  receiptContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  receiptNumber: {
    fontSize: 14,
    color: '#666',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 12,
  },
  disputeButton: {
    backgroundColor: '#fff3e0',
  },
  disputeButtonText: {
    color: '#ff9500',
  },
  notesSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  disputeModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  disputeContent: {
    flex: 1,
    padding: 20,
  },
  disputeInfo: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  disputeSection: {
    marginBottom: 24,
  },
  disputeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  reasonOptions: {
    gap: 8,
  },
  reasonOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedReason: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedReasonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  disputeTextArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#fff',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  disputeActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelDisputeButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelDisputeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitDisputeButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#ff9500',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitDisputeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TransactionDetailScreen;