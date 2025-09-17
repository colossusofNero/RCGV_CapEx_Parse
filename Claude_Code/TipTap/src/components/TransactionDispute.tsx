import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Transaction} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker from 'react-native-image-picker';

export interface DisputeCase {
  id: string;
  transactionId: string;
  reason: DisputeReason;
  description: string;
  evidence?: DisputeEvidence[];
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'resolved';
  submittedAt: Date;
  updatedAt: Date;
  resolutionNotes?: string;
  refundAmount?: number;
}

export interface DisputeEvidence {
  id: string;
  type: 'photo' | 'document' | 'receipt' | 'screenshot';
  uri: string;
  description?: string;
  uploadedAt: Date;
}

export type DisputeReason =
  | 'unauthorized'
  | 'duplicate'
  | 'service_not_received'
  | 'amount_incorrect'
  | 'technical_error'
  | 'fraud'
  | 'other';

interface TransactionDisputeProps {
  transaction: Transaction;
  visible: boolean;
  onClose: () => void;
  onDisputeSubmitted: (disputeCase: DisputeCase) => void;
}

const DISPUTE_REASONS: {value: DisputeReason; label: string; description: string}[] = [
  {
    value: 'unauthorized',
    label: 'Unauthorized Transaction',
    description: 'I did not authorize this transaction',
  },
  {
    value: 'duplicate',
    label: 'Duplicate Charge',
    description: 'I was charged multiple times for the same service',
  },
  {
    value: 'service_not_received',
    label: 'Service Not Received',
    description: 'I did not receive the service I tipped for',
  },
  {
    value: 'amount_incorrect',
    label: 'Incorrect Amount',
    description: 'The charged amount is different from what I intended',
  },
  {
    value: 'technical_error',
    label: 'Technical Error',
    description: 'There was a technical issue with the payment',
  },
  {
    value: 'fraud',
    label: 'Fraudulent Activity',
    description: 'I suspect fraudulent activity on my account',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'My issue is not listed above',
  },
];

const TransactionDispute: React.FC<TransactionDisputeProps> = ({
  transaction,
  visible,
  onClose,
  onDisputeSubmitted,
}) => {
  const [step, setStep] = useState<'reason' | 'details' | 'evidence' | 'review'>('reason');
  const [selectedReason, setSelectedReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setStep('reason');
      setSelectedReason(null);
      setDescription('');
      setEvidence([]);
    }
  }, [visible]);

  const handleReasonSelect = (reason: DisputeReason) => {
    setSelectedReason(reason);
  };

  const handleContinueToDetails = () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for your dispute');
      return;
    }
    setStep('details');
  };

  const handleContinueToEvidence = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of your dispute');
      return;
    }
    setStep('evidence');
  };

  const handleAddEvidence = () => {
    const options = {
      title: 'Add Evidence',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
      mediaType: 'mixed' as const,
      quality: 0.8,
    };

    ImagePicker.showImagePicker(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.uri) {
        const newEvidence: DisputeEvidence = {
          id: `evidence_${Date.now()}`,
          type: response.type?.startsWith('image/') ? 'photo' : 'document',
          uri: response.uri,
          uploadedAt: new Date(),
        };

        setEvidence(prev => [...prev, newEvidence]);
      }
    });
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    setEvidence(prev => prev.filter(e => e.id !== evidenceId));
  };

  const handleContinueToReview = () => {
    setStep('review');
  };

  const handleSubmitDispute = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const disputeCase: DisputeCase = {
        id: `dispute_${Date.now()}`,
        transactionId: transaction.id,
        reason: selectedReason,
        description: description.trim(),
        evidence,
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      // Save dispute to local storage (in real app, this would be sent to backend)
      await saveDisputeCase(disputeCase);

      Alert.alert(
        'Dispute Submitted',
        'Your dispute has been submitted successfully. You will receive an email confirmation shortly. Our team typically reviews disputes within 3-5 business days.',
        [
          {
            text: 'OK',
            onPress: () => {
              onDisputeSubmitted(disputeCase);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      Alert.alert('Error', 'Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDisputeCase = async (disputeCase: DisputeCase) => {
    try {
      const stored = await AsyncStorage.getItem('disputes');
      const disputes: DisputeCase[] = stored ? JSON.parse(stored) : [];
      disputes.push(disputeCase);
      await AsyncStorage.setItem('disputes', JSON.stringify(disputes));
    } catch (error) {
      console.error('Failed to save dispute case:', error);
      throw error;
    }
  };

  const renderReasonStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Why are you disputing this transaction?</Text>
      <Text style={styles.stepDescription}>
        Please select the reason that best describes your issue:
      </Text>

      <ScrollView style={styles.reasonsList}>
        {DISPUTE_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.value}
            style={[
              styles.reasonItem,
              selectedReason === reason.value && styles.selectedReason,
            ]}
            onPress={() => handleReasonSelect(reason.value)}
          >
            <View style={styles.reasonHeader}>
              <View
                style={[
                  styles.radioButton,
                  selectedReason === reason.value && styles.radioButtonSelected,
                ]}
              >
                {selectedReason === reason.value && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.reasonLabel}>{reason.label}</Text>
            </View>
            <Text style={styles.reasonDescription}>{reason.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedReason && styles.disabledButton,
        ]}
        onPress={handleContinueToDetails}
        disabled={!selectedReason}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('reason')}>
        <Icon name="arrow-back" size={24} color="#6b7280" />
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Provide Additional Details</Text>
      <Text style={styles.stepDescription}>
        Please describe your issue in detail. The more information you provide, the faster we can resolve your dispute.
      </Text>

      <View style={styles.selectedReasonSummary}>
        <Text style={styles.summaryLabel}>Selected Reason:</Text>
        <Text style={styles.summaryValue}>
          {DISPUTE_REASONS.find(r => r.value === selectedReason)?.label}
        </Text>
      </View>

      <TextInput
        style={styles.descriptionInput}
        placeholder="Please describe the issue in detail..."
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
        maxLength={1000}
      />

      <Text style={styles.characterCount}>
        {description.length}/1000 characters
      </Text>

      <TouchableOpacity
        style={[
          styles.continueButton,
          !description.trim() && styles.disabledButton,
        ]}
        onPress={handleContinueToEvidence}
        disabled={!description.trim()}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEvidenceStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('details')}>
        <Icon name="arrow-back" size={24} color="#6b7280" />
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Add Supporting Evidence</Text>
      <Text style={styles.stepDescription}>
        Upload photos, receipts, or documents that support your dispute (optional but recommended).
      </Text>

      <TouchableOpacity style={styles.addEvidenceButton} onPress={handleAddEvidence}>
        <Icon name="add-photo-alternate" size={24} color="#007AFF" />
        <Text style={styles.addEvidenceText}>Add Photo or Document</Text>
      </TouchableOpacity>

      {evidence.length > 0 && (
        <View style={styles.evidenceList}>
          <Text style={styles.evidenceTitle}>Uploaded Evidence:</Text>
          {evidence.map((item) => (
            <View key={item.id} style={styles.evidenceItem}>
              <View style={styles.evidenceInfo}>
                <Icon
                  name={item.type === 'photo' ? 'photo' : 'description'}
                  size={20}
                  color="#6b7280"
                />
                <Text style={styles.evidenceType}>
                  {item.type === 'photo' ? 'Photo' : 'Document'}
                </Text>
                <Text style={styles.evidenceDate}>
                  {item.uploadedAt.toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeEvidenceButton}
                onPress={() => handleRemoveEvidence(item.id)}
              >
                <Icon name="close" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinueToReview}
      >
        <Text style={styles.continueButtonText}>Continue to Review</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('evidence')}>
        <Icon name="arrow-back" size={24} color="#6b7280" />
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Review Your Dispute</Text>
      <Text style={styles.stepDescription}>
        Please review the details of your dispute before submitting.
      </Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Transaction Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Transaction ID:</Text>
          <Text style={styles.reviewValue}>{transaction.id}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Amount:</Text>
          <Text style={styles.reviewValue}>${transaction.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Date:</Text>
          <Text style={styles.reviewValue}>
            {new Date(transaction.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Dispute Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Reason:</Text>
          <Text style={styles.reviewValue}>
            {DISPUTE_REASONS.find(r => r.value === selectedReason)?.label}
          </Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Description:</Text>
          <Text style={[styles.reviewValue, styles.reviewDescription]}>
            {description}
          </Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Evidence:</Text>
          <Text style={styles.reviewValue}>
            {evidence.length} file{evidence.length !== 1 ? 's' : ''} attached
          </Text>
        </View>
      </View>

      <View style={styles.importantNotice}>
        <Icon name="info" size={20} color="#f59e0b" />
        <Text style={styles.noticeText}>
          By submitting this dispute, you confirm that the information provided is accurate and complete. False or misleading information may result in account suspension.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.disabledButton,
        ]}
        onPress={handleSubmitDispute}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getStepContent = () => {
    switch (step) {
      case 'reason':
        return renderReasonStep();
      case 'details':
        return renderDetailsStep();
      case 'evidence':
        return renderEvidenceStep();
      case 'review':
        return renderReviewStep();
      default:
        return renderReasonStep();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dispute Transaction</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressBar}>
          {['reason', 'details', 'evidence', 'review'].map((stepName, index) => (
            <View
              key={stepName}
              style={[
                styles.progressStep,
                ['reason', 'details', 'evidence', 'review'].indexOf(step) >= index &&
                  styles.progressStepActive,
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.content}>
          {getStepContent()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  closeButton: {
    padding: 4,
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 32,
  },
  reasonsList: {
    flex: 1,
    marginBottom: 32,
  },
  reasonItem: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedReason: {
    borderColor: '#007AFF',
    backgroundColor: '#eff6ff',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  reasonDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 32,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedReasonSummary: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 32,
  },
  addEvidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 24,
  },
  addEvidenceText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  evidenceList: {
    marginBottom: 32,
  },
  evidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  evidenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  evidenceType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  evidenceDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeEvidenceButton: {
    padding: 4,
    marginLeft: 12,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 120,
  },
  reviewValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  reviewDescription: {
    lineHeight: 20,
  },
  importantNotice: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default TransactionDispute;