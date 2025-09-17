import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface QRPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

const QRPayment: React.FC<QRPaymentProps> = ({amount, onSuccess, onError}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const onSuccess = async (e: any) => {
    setIsProcessing(true);

    try {
      const qrData = e.data;

      // Validate QR code data (should contain payment information)
      if (!qrData || !qrData.includes('payment')) {
        onError('Invalid QR code. Please scan a valid payment QR code.');
        return;
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const transactionId = `qr_${Date.now()}`;

      setShowScanner(false);
      onSuccess(transactionId);
    } catch (error) {
      onError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openScanner = () => {
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <Icon name="qr-code-scanner" size={80} color="#34C759" />

      <Text style={styles.title}>QR Code Payment</Text>

      <Text style={styles.instruction}>
        Tap the button below to open the camera and scan the merchant's QR code to complete your tip payment.
      </Text>

      <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
        <Icon name="camera-alt" size={24} color="#fff" style={styles.scanIcon} />
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </TouchableOpacity>

      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={closeScanner}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Payment QR Code</Text>
            <View style={{width: 24}} />
          </View>

          <QRCodeScanner
            onRead={onSuccess}
            flashMode={QRCodeScanner.Constants.FlashMode.auto}
            topContent={
              <View style={styles.scannerTopContent}>
                <Text style={styles.scannerText}>
                  Position the QR code within the frame to scan
                </Text>
                <Text style={styles.amountText}>Amount: ${amount.toFixed(2)}</Text>
              </View>
            }
            bottomContent={
              <View style={styles.scannerBottomContent}>
                {isProcessing ? (
                  <Text style={styles.processingText}>Processing payment...</Text>
                ) : (
                  <TouchableOpacity style={styles.cancelButton} onPress={closeScanner}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            cameraStyle={styles.camera}
            containerStyle={styles.scannerContainerStyle}
          />
        </View>
      </Modal>
    </View>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  scanIcon: {
    marginRight: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scannerContainerStyle: {
    flex: 1,
  },
  camera: {
    height: height * 0.6,
  },
  scannerTopContent: {
    padding: 20,
    alignItems: 'center',
  },
  scannerText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  scannerBottomContent: {
    padding: 20,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#fff',
    fontStyle: 'italic',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default QRPayment;