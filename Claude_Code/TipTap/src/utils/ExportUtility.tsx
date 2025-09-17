import {Transaction} from '@/types';
import {Alert, Share} from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeNotes?: boolean;
  includeFees?: boolean;
  groupBy?: 'none' | 'date' | 'method' | 'status';
}

export interface ExportSummary {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageAmount: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export class TransactionExporter {
  private static instance: TransactionExporter;

  public static getInstance(): TransactionExporter {
    if (!TransactionExporter.instance) {
      TransactionExporter.instance = new TransactionExporter();
    }
    return TransactionExporter.instance;
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const stored = await AsyncStorage.getItem('transactions');
      if (stored) {
        const transactions: Transaction[] = JSON.parse(stored);
        return transactions.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    }
  }

  filterTransactions(
    transactions: Transaction[],
    options: ExportOptions
  ): Transaction[] {
    let filtered = [...transactions];

    // Filter by date range
    if (options.dateRange) {
      const {startDate, endDate} = options.dateRange;
      filtered = filtered.filter(t => {
        const txDate = new Date(t.timestamp);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered;
  }

  generateSummary(transactions: Transaction[]): ExportSummary {
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const successfulTransactions = transactions.filter(t => t.status === 'completed').length;
    const failedTransactions = transactions.filter(t => t.status === 'failed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    const dates = transactions.map(t => new Date(t.timestamp));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      totalTransactions,
      totalAmount,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      averageAmount,
      dateRange: {startDate, endDate},
    };
  }

  generateCSV(transactions: Transaction[], options: ExportOptions): string {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Amount',
      'Currency',
      'Method',
      'Status',
      'Recipient',
    ];

    if (options.includeNotes) {
      headers.push('Notes');
    }

    if (options.includeFees) {
      headers.push('Processing Fee', 'Net Amount');
    }

    const csvRows = [headers.join(',')];

    // Add summary row
    const summary = this.generateSummary(transactions);
    csvRows.push(''); // Empty line
    csvRows.push('SUMMARY');
    csvRows.push(`Total Transactions,${summary.totalTransactions}`);
    csvRows.push(`Total Amount,${summary.totalAmount.toFixed(2)}`);
    csvRows.push(`Successful,${summary.successfulTransactions}`);
    csvRows.push(`Failed,${summary.failedTransactions}`);
    csvRows.push(`Pending,${summary.pendingTransactions}`);
    csvRows.push(`Average Amount,${summary.averageAmount.toFixed(2)}`);
    csvRows.push(`Date Range,${summary.dateRange.startDate.toLocaleDateString()} - ${summary.dateRange.endDate.toLocaleDateString()}`);
    csvRows.push(''); // Empty line
    csvRows.push('TRANSACTIONS');

    // Process transactions by group if specified
    let groupedTransactions: {[key: string]: Transaction[]} = {};

    if (options.groupBy && options.groupBy !== 'none') {
      transactions.forEach(transaction => {
        let groupKey = '';

        switch (options.groupBy) {
          case 'date':
            groupKey = new Date(transaction.timestamp).toLocaleDateString();
            break;
          case 'method':
            groupKey = transaction.method.toUpperCase();
            break;
          case 'status':
            groupKey = transaction.status.toUpperCase();
            break;
          default:
            groupKey = 'ALL';
        }

        if (!groupedTransactions[groupKey]) {
          groupedTransactions[groupKey] = [];
        }
        groupedTransactions[groupKey].push(transaction);
      });
    } else {
      groupedTransactions['ALL'] = transactions;
    }

    // Generate CSV data for each group
    Object.keys(groupedTransactions).forEach(groupKey => {
      if (options.groupBy && options.groupBy !== 'none') {
        csvRows.push(`\n${options.groupBy.toUpperCase()}: ${groupKey}`);
      }

      groupedTransactions[groupKey].forEach(transaction => {
        const row = [
          `"${transaction.id}"`,
          `"${new Date(transaction.timestamp).toLocaleDateString()}"`,
          `"${new Date(transaction.timestamp).toLocaleTimeString()}"`,
          transaction.amount.toFixed(2),
          `"${transaction.currency}"`,
          `"${transaction.method.toUpperCase()}"`,
          `"${transaction.status.toUpperCase()}"`,
          `"${transaction.recipient || ''}"`,
        ];

        if (options.includeNotes) {
          row.push(`"${(transaction.notes || '').replace(/"/g, '""')}"`);
        }

        if (options.includeFees) {
          const processingFee = transaction.amount * 0.029;
          const netAmount = transaction.amount - processingFee;
          row.push(processingFee.toFixed(2), netAmount.toFixed(2));
        }

        csvRows.push(row.join(','));
      });
    });

    return csvRows.join('\n');
  }

  async generatePDFContent(transactions: Transaction[], options: ExportOptions): Promise<string> {
    // In a real implementation, this would use a PDF generation library
    // For now, we'll return formatted text that could be converted to PDF

    const summary = this.generateSummary(transactions);

    let content = `
TipTap Transaction Export Report
Generated: ${new Date().toLocaleString()}

SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Transactions: ${summary.totalTransactions}
Total Amount: $${summary.totalAmount.toFixed(2)}
Successful: ${summary.successfulTransactions}
Failed: ${summary.failedTransactions}
Pending: ${summary.pendingTransactions}
Average Amount: $${summary.averageAmount.toFixed(2)}
Date Range: ${summary.dateRange.startDate.toLocaleDateString()} - ${summary.dateRange.endDate.toLocaleDateString()}

TRANSACTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    let groupedTransactions: {[key: string]: Transaction[]} = {};

    if (options.groupBy && options.groupBy !== 'none') {
      transactions.forEach(transaction => {
        let groupKey = '';

        switch (options.groupBy) {
          case 'date':
            groupKey = new Date(transaction.timestamp).toLocaleDateString();
            break;
          case 'method':
            groupKey = transaction.method.toUpperCase();
            break;
          case 'status':
            groupKey = transaction.status.toUpperCase();
            break;
          default:
            groupKey = 'ALL';
        }

        if (!groupedTransactions[groupKey]) {
          groupedTransactions[groupKey] = [];
        }
        groupedTransactions[groupKey].push(transaction);
      });
    } else {
      groupedTransactions['ALL'] = transactions;
    }

    Object.keys(groupedTransactions).forEach(groupKey => {
      if (options.groupBy && options.groupBy !== 'none') {
        content += `\n${options.groupBy.toUpperCase()}: ${groupKey}\n`;
        content += '─'.repeat(40) + '\n';
      }

      groupedTransactions[groupKey].forEach(transaction => {
        content += `
Transaction ID: ${transaction.id}
Date: ${new Date(transaction.timestamp).toLocaleDateString()}
Time: ${new Date(transaction.timestamp).toLocaleTimeString()}
Amount: $${transaction.amount.toFixed(2)} ${transaction.currency}
Method: ${transaction.method.toUpperCase()}
Status: ${transaction.status.toUpperCase()}
${transaction.recipient ? `Recipient: ${transaction.recipient}` : ''}
${transaction.notes && options.includeNotes ? `Notes: ${transaction.notes}` : ''}
${options.includeFees ? `Processing Fee: $${(transaction.amount * 0.029).toFixed(2)}` : ''}
${options.includeFees ? `Net Amount: $${(transaction.amount * 0.971).toFixed(2)}` : ''}
`;
        content += '─'.repeat(40) + '\n';
      });
    });

    content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
End of Report
Generated by TipTap v1.0.0
For questions: support@tiptap.com
`;

    return content;
  }

  async exportTransactions(options: ExportOptions): Promise<string> {
    try {
      const allTransactions = await this.getTransactions();
      const filteredTransactions = this.filterTransactions(allTransactions, options);

      if (filteredTransactions.length === 0) {
        Alert.alert('No Data', 'No transactions found for the selected criteria.');
        throw new Error('No transactions to export');
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
      let fileName: string;
      let content: string;
      let filePath: string;

      if (options.format === 'csv') {
        content = this.generateCSV(filteredTransactions, options);
        fileName = `tiptap_transactions_${timestamp}.csv`;
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, content, 'utf8');
      } else {
        content = await this.generatePDFContent(filteredTransactions, options);
        fileName = `tiptap_transactions_${timestamp}.txt`; // In reality, this would be .pdf
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, content, 'utf8');
      }

      return filePath;
    } catch (error) {
      console.error('Failed to export transactions:', error);
      throw error;
    }
  }

  async shareExport(filePath: string): Promise<void> {
    try {
      await Share.share({
        url: `file://${filePath}`,
        title: 'TipTap Transaction Export',
      });
    } catch (error) {
      console.error('Failed to share export:', error);
      Alert.alert('Error', 'Failed to share the export file.');
    }
  }

  async emailExport(filePath: string, emailAddress?: string): Promise<void> {
    try {
      const fileName = filePath.split('/').pop() || 'export';
      const subject = `TipTap Transaction Export - ${fileName}`;
      const body = `Please find attached your TipTap transaction export.

Generated: ${new Date().toLocaleString()}

If you have any questions, please contact support@tiptap.com

Best regards,
The TipTap Team`;

      // In a real implementation, this would use a proper email library
      // that supports attachments. For now, we'll show an alert.
      Alert.alert(
        'Email Export',
        `Export file created: ${fileName}\n\nIn a production app, this would be sent via email ${emailAddress ? `to ${emailAddress}` : ''}.`,
        [{text: 'OK'}]
      );
    } catch (error) {
      console.error('Failed to email export:', error);
      Alert.alert('Error', 'Failed to prepare email export.');
    }
  }
}

export default TransactionExporter;