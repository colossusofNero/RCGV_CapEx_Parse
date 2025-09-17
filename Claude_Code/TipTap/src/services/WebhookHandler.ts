import crypto from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentService } from '@/application/services/PaymentService';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      payment_intent?: string;
      metadata?: Record<string, string>;
    };
  };
  created: number;
}

export interface PlaidWebhookEvent {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  environment: string;
  payment_id?: string;
  new_payment_status?: string;
  old_payment_status?: string;
  timestamp: string;
}

export interface WebhookProcessResult {
  success: boolean;
  processed: boolean;
  error?: string;
  transactionId?: string;
}

const WEBHOOK_STORAGE_KEY = 'processed_webhooks';

export class WebhookHandler {
  private static instance: WebhookHandler;
  private paymentService: PaymentService;

  private constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  public static getInstance(paymentService: PaymentService): WebhookHandler {
    if (!WebhookHandler.instance) {
      WebhookHandler.instance = new WebhookHandler(paymentService);
    }
    return WebhookHandler.instance;
  }

  // Handle Stripe webhook events
  async handleStripeWebhook(
    payload: string,
    signature: string,
    endpointSecret: string
  ): Promise<WebhookProcessResult> {
    try {
      // Verify webhook signature
      if (!this.verifyStripeSignature(payload, signature, endpointSecret)) {
        return {
          success: false,
          processed: false,
          error: 'Invalid webhook signature',
        };
      }

      const event: StripeWebhookEvent = JSON.parse(payload);

      // Check if we've already processed this event
      const isAlreadyProcessed = await this.isWebhookProcessed(event.id);
      if (isAlreadyProcessed) {
        return {
          success: true,
          processed: false,
          error: 'Webhook already processed',
        };
      }

      let result: WebhookProcessResult = {
        success: false,
        processed: false,
      };

      switch (event.type) {
        case 'payment_intent.succeeded':
          result = await this.handlePaymentIntentSucceeded(event);
          break;

        case 'payment_intent.payment_failed':
          result = await this.handlePaymentIntentFailed(event);
          break;

        case 'payment_intent.requires_action':
          result = await this.handlePaymentIntentRequiresAction(event);
          break;

        case 'charge.dispute.created':
          result = await this.handleChargeDisputeCreated(event);
          break;

        default:
          console.log(`Unhandled Stripe webhook event: ${event.type}`);
          result = {
            success: true,
            processed: false,
            error: `Unhandled event type: ${event.type}`,
          };
      }

      // Mark webhook as processed
      if (result.success) {
        await this.markWebhookAsProcessed(event.id);
      }

      return result;

    } catch (error: any) {
      console.error('Error processing Stripe webhook:', error);
      return {
        success: false,
        processed: false,
        error: error.message || 'Webhook processing failed',
      };
    }
  }

  // Handle Plaid webhook events
  async handlePlaidWebhook(payload: string): Promise<WebhookProcessResult> {
    try {
      const event: PlaidWebhookEvent = JSON.parse(payload);

      // Generate a unique ID for Plaid webhooks since they don't have one
      const webhookId = crypto.SHA256(`${event.webhook_type}_${event.item_id}_${event.timestamp}`).toString();

      // Check if we've already processed this event
      const isAlreadyProcessed = await this.isWebhookProcessed(webhookId);
      if (isAlreadyProcessed) {
        return {
          success: true,
          processed: false,
          error: 'Webhook already processed',
        };
      }

      let result: WebhookProcessResult = {
        success: false,
        processed: false,
      };

      switch (event.webhook_type) {
        case 'PAYMENT_STATUS_UPDATE':
          result = await this.handlePlaidPaymentStatusUpdate(event);
          break;

        case 'ITEM_ERROR':
          result = await this.handlePlaidItemError(event);
          break;

        case 'ITEM_LOGIN_REQUIRED':
          result = await this.handlePlaidItemLoginRequired(event);
          break;

        default:
          console.log(`Unhandled Plaid webhook event: ${event.webhook_type}`);
          result = {
            success: true,
            processed: false,
            error: `Unhandled event type: ${event.webhook_type}`,
          };
      }

      // Mark webhook as processed
      if (result.success) {
        await this.markWebhookAsProcessed(webhookId);
      }

      return result;

    } catch (error: any) {
      console.error('Error processing Plaid webhook:', error);
      return {
        success: false,
        processed: false,
        error: error.message || 'Webhook processing failed',
      };
    }
  }

  // Stripe webhook event handlers
  private async handlePaymentIntentSucceeded(event: StripeWebhookEvent): Promise<WebhookProcessResult> {
    try {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.metadata?.transactionId;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          error: 'No transaction ID in payment intent metadata',
        };
      }

      // Update transaction status to completed
      const result = await this.paymentService.getPaymentStatus(
        // This would need to be retrieved based on the transaction
        {} as any, // gateway placeholder
        transactionId
      );

      return {
        success: true,
        processed: true,
        transactionId,
      };

    } catch (error: any) {
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to handle payment success',
      };
    }
  }

  private async handlePaymentIntentFailed(event: StripeWebhookEvent): Promise<WebhookProcessResult> {
    try {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.metadata?.transactionId;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          error: 'No transaction ID in payment intent metadata',
        };
      }

      // Update transaction status to failed
      // This would require updating the transaction in the database
      console.log(`Payment failed for transaction: ${transactionId}`);

      return {
        success: true,
        processed: true,
        transactionId,
      };

    } catch (error: any) {
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to handle payment failure',
      };
    }
  }

  private async handlePaymentIntentRequiresAction(event: StripeWebhookEvent): Promise<WebhookProcessResult> {
    try {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.metadata?.transactionId;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          error: 'No transaction ID in payment intent metadata',
        };
      }

      // Handle 3D Secure or other authentication requirements
      console.log(`Payment requires action for transaction: ${transactionId}`);

      return {
        success: true,
        processed: true,
        transactionId,
      };

    } catch (error: any) {
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to handle payment action required',
      };
    }
  }

  private async handleChargeDisputeCreated(event: StripeWebhookEvent): Promise<WebhookProcessResult> {
    try {
      const dispute = event.data.object;

      // Handle dispute creation - notify relevant parties
      console.log(`Dispute created for charge: ${dispute.id}`);

      return {
        success: true,
        processed: true,
      };

    } catch (error: any) {
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to handle dispute creation',
      };
    }
  }

  // Plaid webhook event handlers
  private async handlePlaidPaymentStatusUpdate(event: PlaidWebhookEvent): Promise<WebhookProcessResult> {
    try {
      if (!event.payment_id) {
        return {
          success: false,
          processed: false,
          error: 'No payment ID in webhook event',
        };
      }

      // Update payment status based on the webhook
      console.log(`Plaid payment status updated: ${event.payment_id} from ${event.old_payment_status} to ${event.new_payment_status}`);

      return {
        success: true,
        processed: true,
        transactionId: event.payment_id,
      };

    } catch (error: any) {
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to handle Plaid payment status update',
      };
    }
  }

  private async handlePlaidItemError(event: PlaidWebhookEvent): Promise<WebhookProcessResult> {
    try {
      // Handle item errors - notify user of connection issues
      console.log(`Plaid item error for item: ${event.item_id}`);

      return {
        success: true,
        processed: true,
      };

    } catch (error: any) {
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to handle Plaid item error',
      };
    }
  }

  private async handlePlaidItemLoginRequired(event: PlaidWebhookEvent): Promise<WebhookProcessResult> {
    try {
      // Handle login required - notify user to re-authenticate
      console.log(`Plaid login required for item: ${event.item_id}`);

      return {
        success: true,
        processed: true,
      };

    } catch (error: any) {
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to handle Plaid login required',
      };
    }
  }

  // Utility methods
  private verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const elements = signature.split(',');
      const timestamp = elements.find(el => el.startsWith('t='))?.substring(2);
      const stripeSignature = elements.find(el => el.startsWith('v1='))?.substring(3);

      if (!timestamp || !stripeSignature) {
        return false;
      }

      const payloadForSign = `${timestamp}.${payload}`;
      const expectedSignature = crypto.HmacSHA256(payloadForSign, secret).toString();

      return crypto.lib.WordArray.create(expectedSignature).toString() === stripeSignature;
    } catch (error) {
      console.error('Error verifying Stripe signature:', error);
      return false;
    }
  }

  private async isWebhookProcessed(webhookId: string): Promise<boolean> {
    try {
      const processedWebhooks = await AsyncStorage.getItem(WEBHOOK_STORAGE_KEY);
      const webhookSet = processedWebhooks ? new Set(JSON.parse(processedWebhooks)) : new Set();
      return webhookSet.has(webhookId);
    } catch (error) {
      console.error('Error checking webhook processing status:', error);
      return false;
    }
  }

  private async markWebhookAsProcessed(webhookId: string): Promise<void> {
    try {
      const processedWebhooks = await AsyncStorage.getItem(WEBHOOK_STORAGE_KEY);
      const webhookSet = processedWebhooks ? new Set(JSON.parse(processedWebhooks)) : new Set();

      webhookSet.add(webhookId);

      // Keep only the last 1000 processed webhooks to avoid storage bloat
      const webhookArray = Array.from(webhookSet);
      if (webhookArray.length > 1000) {
        const recentWebhooks = webhookArray.slice(-1000);
        await AsyncStorage.setItem(WEBHOOK_STORAGE_KEY, JSON.stringify(recentWebhooks));
      } else {
        await AsyncStorage.setItem(WEBHOOK_STORAGE_KEY, JSON.stringify(webhookArray));
      }
    } catch (error) {
      console.error('Error marking webhook as processed:', error);
    }
  }

  // Cleanup old processed webhooks
  async cleanupOldWebhooks(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // This is a simplified cleanup - in a real implementation you'd track timestamps
      const processedWebhooks = await AsyncStorage.getItem(WEBHOOK_STORAGE_KEY);
      if (processedWebhooks) {
        const webhookArray = JSON.parse(processedWebhooks);
        // Keep only the most recent 500 webhooks
        const recentWebhooks = webhookArray.slice(-500);
        await AsyncStorage.setItem(WEBHOOK_STORAGE_KEY, JSON.stringify(recentWebhooks));
      }
    } catch (error) {
      console.error('Error cleaning up old webhooks:', error);
    }
  }
}

export default WebhookHandler;