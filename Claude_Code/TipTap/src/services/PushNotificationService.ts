import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TipTapAPI from '@/api/TipTapAPI';
import { APP_CONFIG } from '@/shared/constants/AppConstants';

// Note: Firebase messaging would need to be installed separately
// npm install @react-native-firebase/app @react-native-firebase/messaging
// For now, we'll use mock implementations for Firebase-specific features

export interface NotificationPayload {
  type: 'tip_received' | 'transaction_update' | 'balance_update' | 'security_alert' | 'system_message';
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushNotificationPermissions {
  hasPermission: boolean;
  canRequest: boolean;
  authorizationStatus: 'authorized' | 'denied' | 'not_determined' | 'provisional';
}

// Mock Firebase messaging types for development
interface RemoteMessage {
  messageId?: string;
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, any>;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;
  private isInitialized = false;
  private messageHandlers: Map<string, (message: NotificationPayload) => void> = new Map();

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Initialize push notification service
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get push token (would be FCM token in production)
      await this.getPushToken();

      // Setup message handlers
      this.setupMessageHandlers();

      // Check for initial notification (app opened from notification)
      await this.checkInitialNotification();

      this.isInitialized = true;
      console.log('PushNotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PushNotificationService:', error);
      throw error;
    }
  }

  // Request push notification permissions
  async requestPermissions(): Promise<PushNotificationPermissions> {
    try {
      // Mock permission request - in production this would use actual notification APIs
      const permissions: PushNotificationPermissions = {
        hasPermission: true,
        canRequest: true,
        authorizationStatus: 'authorized',
      };

      if (permissions.hasPermission && !this.pushToken) {
        await this.getPushToken();
      }

      return permissions;
    } catch (error) {
      console.error('Failed to request push notification permissions:', error);
      return {
        hasPermission: false,
        canRequest: false,
        authorizationStatus: 'denied',
      };
    }
  }

  // Get current permission status
  async getPermissionStatus(): Promise<PushNotificationPermissions> {
    try {
      // Mock permission status - in production this would check actual permissions
      return {
        hasPermission: this.pushToken !== null,
        canRequest: true,
        authorizationStatus: this.pushToken ? 'authorized' : 'not_determined',
      };
    } catch (error) {
      console.error('Failed to get permission status:', error);
      return {
        hasPermission: false,
        canRequest: false,
        authorizationStatus: 'denied',
      };
    }
  }

  // Get push token (mock implementation)
  private async getPushToken(): Promise<string | null> {
    try {
      // Generate a mock token - in production this would be the actual FCM/APNS token
      const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
      this.pushToken = token;
      await this.storePushToken(token);

      // Register token with backend
      await this.registerTokenWithBackend(token);
      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  // Store push token locally
  private async storePushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@tiptap_push_token', token);
    } catch (error) {
      console.error('Failed to store push token:', error);
    }
  }

  // Get stored push token
  async getStoredPushToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('@tiptap_push_token');
      return token;
    } catch (error) {
      console.error('Failed to get stored push token:', error);
      return null;
    }
  }

  // Register token with backend
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const currentUser = await TipTapAPI.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot register push token: User not authenticated');
        return;
      }

      await TipTapAPI.registerPushToken({
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: await this.getDeviceId(),
      });

      console.log('Push token registered with backend successfully');
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  }

  // Unregister token from backend
  async unregisterTokenFromBackend(): Promise<void> {
    try {
      const token = await this.getStoredPushToken();
      if (!token) return;

      await TipTapAPI.unregisterPushToken({
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: await this.getDeviceId(),
      });

      console.log('Push token unregistered from backend successfully');
    } catch (error) {
      console.error('Failed to unregister push token from backend:', error);
    }
  }

  // Get device ID
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('@tiptap_device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
        await AsyncStorage.setItem('@tiptap_device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      return `fallback_${Date.now()}`;
    }
  }

  // Setup message handlers
  private setupMessageHandlers(): void {
    // Mock message handler setup
    // In production, this would set up Firebase messaging handlers
    console.log('Push notification message handlers configured');
  }

  // Check for initial notification (app opened from quit state)
  private async checkInitialNotification(): Promise<void> {
    try {
      // Mock implementation - in production this would check for initial notification
      console.log('Checked for initial notification');
    } catch (error) {
      console.error('Failed to check initial notification:', error);
    }
  }

  // Handle incoming messages
  private async handleMessage(
    remoteMessage: RemoteMessage,
    source: 'foreground' | 'background' | 'quit'
  ): Promise<void> {
    try {
      const payload: NotificationPayload = {
        type: remoteMessage.data?.type as any || 'system_message',
        title: remoteMessage.notification?.title || 'TipTap',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      };

      // Call registered handlers
      const handler = this.messageHandlers.get(payload.type);
      if (handler) {
        handler(payload);
      }

      // Call global handler if registered
      const globalHandler = this.messageHandlers.get('*');
      if (globalHandler) {
        globalHandler(payload);
      }

      // Log message for debugging
      console.log(`Handled ${source} message:`, payload);
    } catch (error) {
      console.error('Failed to handle push message:', error);
    }
  }

  // Register message handler for specific notification type
  registerMessageHandler(type: string, handler: (message: NotificationPayload) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // Unregister message handler
  unregisterMessageHandler(type: string): void {
    this.messageHandlers.delete(type);
  }

  // Clear all message handlers
  clearAllHandlers(): void {
    this.messageHandlers.clear();
  }

  // Test push notification
  async testNotification(type: 'tip_received' | 'transaction_update' | 'security_alert' = 'tip_received'): Promise<void> {
    try {
      await TipTapAPI.testPushNotification(type);
      console.log(`Test notification sent: ${type}`);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // Get current push token
  getCurrentToken(): string | null {
    return this.pushToken;
  }

  // Check if service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup service
  cleanup(): void {
    this.clearAllHandlers();
    this.isInitialized = false;
    this.pushToken = null;
  }

  // Subscribe to topic (for broadcast notifications)
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      // Mock implementation - in production this would subscribe to FCM topics
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      // Mock implementation - in production this would unsubscribe from FCM topics
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
      throw error;
    }
  }

  // Set notification badge count (iOS only)
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      // This would require iOS-specific implementation
      console.log(`Setting badge count to: ${count}`);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    try {
      // This would clear all notifications from the notification center
      console.log('Clearing all notifications');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }
}

export default PushNotificationService;