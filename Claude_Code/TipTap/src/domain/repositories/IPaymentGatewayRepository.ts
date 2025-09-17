import { PaymentGateway, PaymentRequest, PaymentResponse } from '../entities/PaymentGateway';

export interface IPaymentGatewayRepository {
  processPayment(gateway: PaymentGateway, request: PaymentRequest): Promise<PaymentResponse>;
  refundPayment(gateway: PaymentGateway, transactionId: string, amount?: number): Promise<PaymentResponse>;
  getPaymentStatus(gateway: PaymentGateway, transactionId: string): Promise<PaymentResponse>;
  validateGateway(gateway: PaymentGateway): Promise<boolean>;
}