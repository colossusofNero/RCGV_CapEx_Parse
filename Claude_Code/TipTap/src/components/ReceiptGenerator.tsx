import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Share,
  Platform,
  Linking,
} from 'react-native';
import {Transaction} from '@/types';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';

interface ReceiptGeneratorProps {
  transaction: Transaction;
  onReceiptGenerated?: (uri: string) => void;
  children?: React.ReactNode;
}

interface ReceiptData {
  transaction: Transaction;
  merchantInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  receiptNumber: string;
  timestamp: Date;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  transaction,
  onReceiptGenerated,
  children,
}) => {
  const receiptRef = React.useRef<ViewShot>(null);

  const generateReceiptData = (): ReceiptData => {
    return {
      transaction,
      merchantInfo: {
        name: 'Service Provider',
        address: '123 Business St, City, State 12345',
        phone: '(555) 123-4567',
        email: 'support@tiptap.com',
      },
      receiptNumber: `R-${transaction.id.slice(-8).toUpperCase()}`,
      timestamp: new Date(),
    };
  };

  const captureReceipt = async (): Promise<string> => {
    if (!receiptRef.current) {
      throw new Error('Receipt reference not available');
    }

    try {
      const uri = await receiptRef.current.capture();
      return uri;
    } catch (error) {
      console.error('Failed to capture receipt:', error);
      throw error;
    }
  };

  const generateTextReceipt = (data: ReceiptData): string => {
    const {transaction, merchantInfo, receiptNumber, timestamp} = data;

    return `
╔════════════════════════════════════╗
║            TipTap Receipt          ║
╚════════════════════════════════════╝

Receipt #: ${receiptNumber}
Date: ${timestamp.toLocaleDateString('en-US')}
Time: ${timestamp.toLocaleTimeString('en-US')}

────────────────────────────────────────

TRANSACTION DETAILS
Transaction ID: ${transaction.id}
Payment Method: ${transaction.method.toUpperCase()}
Status: ${transaction.status.toUpperCase()}

────────────────────────────────────────

AMOUNT BREAKDOWN
Tip Amount:                    $${transaction.amount.toFixed(2)}
Processing Fee:                $${(transaction.amount * 0.029).toFixed(2)}
                              ─────────────
Net Amount:                    $${(transaction.amount * 0.971).toFixed(2)}

${merchantInfo ? `
────────────────────────────────────────

MERCHANT INFORMATION
${merchantInfo.name}
${merchantInfo.address || ''}
${merchantInfo.phone ? `Phone: ${merchantInfo.phone}` : ''}
${merchantInfo.email ? `Email: ${merchantInfo.email}` : ''}
` : ''}

${transaction.notes ? `
────────────────────────────────────────

NOTES
${transaction.notes}
` : ''}

────────────────────────────────────────

Thank you for using TipTap!

For support or questions:
Email: support@tiptap.com
Web: www.tiptap.com

This is a digital receipt.
Keep this for your records.

────────────────────────────────────────
Generated on ${new Date().toLocaleString('en-US')}
    `.trim();
  };

  const generatePDFReceipt = async (): Promise<string> => {
    try {
      const imageUri = await captureReceipt();

      // In a real implementation, you would use a PDF generation library
      // like react-native-pdf-lib or send to a backend service
      // For now, we'll simulate PDF generation

      const pdfPath = `${RNFS.DocumentDirectoryPath}/receipt-${transaction.id}.pdf`;

      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In reality, you would convert the image to PDF here
      // For now, we'll just copy the image with a PDF extension
      await RNFS.copyFile(imageUri, pdfPath);

      return pdfPath;
    } catch (error) {
      console.error('Failed to generate PDF receipt:', error);
      throw error;
    }
  };

  const shareReceipt = async (format: 'text' | 'image' | 'pdf' = 'text') => {
    try {
      const data = generateReceiptData();

      switch (format) {
        case 'text':
          const textReceipt = generateTextReceipt(data);
          await Share.share({
            message: textReceipt,
            title: `TipTap Receipt - ${data.receiptNumber}`,
          });
          break;

        case 'image':
          const imageUri = await captureReceipt();
          await Share.share({
            url: imageUri,
            title: `TipTap Receipt - ${data.receiptNumber}`,
          });
          break;

        case 'pdf':
          const pdfPath = await generatePDFReceipt();
          await Share.share({
            url: `file://${pdfPath}`,
            title: `TipTap Receipt - ${data.receiptNumber}`,
          });
          break;
      }
    } catch (error) {
      console.error('Failed to share receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    }
  };

  const emailReceipt = async (format: 'text' | 'pdf' = 'text') => {
    try {
      const data = generateReceiptData();
      const subject = `TipTap Receipt - ${data.receiptNumber}`;

      let emailUrl: string;

      if (format === 'text') {
        const textReceipt = generateTextReceipt(data);
        emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textReceipt)}`;
      } else {
        const pdfPath = await generatePDFReceipt();
        emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&attachment=${encodeURIComponent(pdfPath)}`;
      }

      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'No email app available');
      }
    } catch (error) {
      console.error('Failed to email receipt:', error);
      Alert.alert('Error', 'Failed to prepare email. Please try again.');
    }
  };

  const downloadReceipt = async (format: 'image' | 'pdf' = 'pdf') => {
    try {
      let filePath: string;
      let fileName: string;

      if (format === 'image') {
        const imageUri = await captureReceipt();
        fileName = `receipt-${transaction.id}.png`;
        filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.copyFile(imageUri, filePath);
      } else {
        filePath = await generatePDFReceipt();
        fileName = `receipt-${transaction.id}.pdf`;
        const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.copyFile(filePath, downloadPath);
        filePath = downloadPath;
      }

      Alert.alert(
        'Receipt Downloaded',
        `Receipt saved as ${fileName} in your Downloads folder.`,
        [{text: 'OK'}]
      );

      if (onReceiptGenerated) {
        onReceiptGenerated(filePath);
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      Alert.alert('Error', 'Failed to download receipt. Please try again.');
    }
  };

  return (
    <>
      {children}
      <ViewShot
        ref={receiptRef}
        options={{
          format: 'png',
          quality: 0.9,
          width: 400,
          height: 600,
        }}
        style={styles.hiddenReceipt}
      >
        <ReceiptTemplate transaction={transaction} />
      </ViewShot>
    </>
  );
};

interface ReceiptTemplateProps {
  transaction: Transaction;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({transaction}) => {
  const data = {
    transaction,
    merchantInfo: {
      name: 'Service Provider',
      address: '123 Business St, City, State 12345',
      phone: '(555) 123-4567',
    },
    receiptNumber: `R-${transaction.id.slice(-8).toUpperCase()}`,
    timestamp: new Date(),
  };

  return (
    <View style={styles.receipt}>
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptTitle}>TipTap Receipt</Text>
        <Text style={styles.receiptNumber}>#{data.receiptNumber}</Text>
      </View>

      <View style={styles.receiptSection}>
        <Text style={styles.sectionTitle}>Transaction Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {data.timestamp.toLocaleDateString('en-US')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>
            {data.timestamp.toLocaleTimeString('en-US')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction ID:</Text>
          <Text style={[styles.detailValue, styles.monospace]}>
            {transaction.id}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>
            {transaction.method.toUpperCase()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text
            style={[
              styles.detailValue,
              transaction.status === 'completed'
                ? styles.statusCompleted
                : styles.statusPending,
            ]}
          >
            {transaction.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.receiptSection}>
        <Text style={styles.sectionTitle}>Amount Breakdown</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tip Amount:</Text>
          <Text style={styles.detailValue}>${transaction.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Processing Fee:</Text>
          <Text style={styles.detailValue}>
            ${(transaction.amount * 0.029).toFixed(2)}
          </Text>
        </View>
        <View style={styles.dividerLine} />
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, styles.totalLabel]}>Net Amount:</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            ${(transaction.amount * 0.971).toFixed(2)}
          </Text>
        </View>
      </View>

      {data.merchantInfo && (
        <View style={styles.receiptSection}>
          <Text style={styles.sectionTitle}>Service Provider</Text>
          <Text style={styles.merchantName}>{data.merchantInfo.name}</Text>
          <Text style={styles.merchantInfo}>{data.merchantInfo.address}</Text>
          <Text style={styles.merchantInfo}>{data.merchantInfo.phone}</Text>
        </View>
      )}

      {transaction.notes && (
        <View style={styles.receiptSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{transaction.notes}</Text>
        </View>
      )}

      <View style={styles.receiptFooter}>
        <Text style={styles.footerText}>Thank you for using TipTap!</Text>
        <Text style={styles.footerText}>support@tiptap.com</Text>
        <Text style={styles.footerSmall}>
          Generated on {new Date().toLocaleString('en-US')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenReceipt: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  receipt: {
    width: 400,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  receiptSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'right',
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  statusCompleted: {
    color: '#10b981',
    fontWeight: '600',
  },
  statusPending: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  merchantInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerSmall: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
});

// Export methods for external use
export const ReceiptActions = {
  shareReceipt: (transaction: Transaction, format: 'text' | 'image' | 'pdf' = 'text') => {
    // This would be implemented using the ReceiptGenerator methods
  },
  emailReceipt: (transaction: Transaction, format: 'text' | 'pdf' = 'text') => {
    // This would be implemented using the ReceiptGenerator methods
  },
  downloadReceipt: (transaction: Transaction, format: 'image' | 'pdf' = 'pdf') => {
    // This would be implemented using the ReceiptGenerator methods
  },
};

export default ReceiptGenerator;