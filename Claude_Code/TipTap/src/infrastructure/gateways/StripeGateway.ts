import { AbstractPaymentGateway } from './AbstractPaymentGateway';
import { PaymentGateway, PaymentRequest, PaymentResponse } from '@/domain/entities/PaymentGateway';
import StripeService from '@/services/StripeService';

export class StripeGateway extends AbstractPaymentGateway {
  private stripeService = StripeService.getInstance();

  async processPayment(gateway: PaymentGateway, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validateRequest(request);

      // Generate idempotency key to prevent duplicates
      const idempotencyKey = this.stripeService.generateIdempotencyKey();

      // Create payment intent on backend
      const paymentIntentResponse = await this.stripeService.createPaymentIntent({
        amount: request.amount,
        currency: request.currency,
        customerId: request.customerId,
        description: request.description,
        metadata: request.metadata,
      }, idempotencyKey);

      // Process payment with 3D Secure support
      const paymentResult = await this.stripeService.processPayment(
        paymentIntentResponse.clientSecret,
        request.paymentMethodId
      );

      if (paymentResult.success) {
        return this.createSuccessResponse(
          request.metadata?.transactionId || 'temp_id',
          paymentResult.paymentIntentId || paymentIntentResponse.paymentIntentId,
          {
            stripe_payment_intent_id: paymentResult.paymentIntentId,
            client_secret: paymentIntentResponse.clientSecret
          }
        );
      } else {
        return this.createFailureResponse(
          request.metadata?.transactionId || 'temp_id',
          paymentResult.errorCode || 'STRIPE_ERROR',
          paymentResult.error || 'Payment processing failed'
        );
      }
    } catch (error: any) {
      return this.createFailureResponse(
        request.metadata?.transactionId || 'temp_id',
        'STRIPE_ERROR',
        error.message || 'Payment processing failed'
      );
    }
  }

  async refundPayment(gateway: PaymentGateway, transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      // Note: Refunds are typically handled on the backend
      // This would need to call your backend API to process the refund
      const response = await fetch(`${this.getBackendUrl()}/stripe/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: transactionId,
          amount: amount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const refundData = await response.json();

      return this.createSuccessResponse(
        transactionId,
        refundData.refund_id,
        { stripe_refund_id: refundData.refund_id }
      );
    } catch (error: any) {
      return this.createFailureResponse(
        transactionId,
        'STRIPE_REFUND_ERROR',
        error.message || 'Refund processing failed'
      );
    }
  }

  async getPaymentStatus(gateway: PaymentGateway, transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.getBackendUrl()}/stripe/payment-intent/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const paymentData = await response.json();

      return this.createSuccessResponse(
        transactionId,
        transactionId,
        {
          status: paymentData.status,
          payment_intent: paymentData
        }
      );
    } catch (error: any) {
      return this.createFailureResponse(
        transactionId,
        'STRIPE_RETRIEVE_ERROR',
        error.message || 'Failed to retrieve payment status'
      );
    }
  }

  async validateGateway(gateway: PaymentGateway): Promise<boolean> {
    return !!(gateway.configuration.secretKey && gateway.configuration.publishableKey);
  }

  private getBackendUrl(): string {
    return __DEV__
      ? 'http://localhost:3000/api'
      : 'https://your-api.com/api';
  }
}