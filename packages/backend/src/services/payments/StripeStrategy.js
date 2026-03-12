import { PaymentStrategy } from './PaymentStrategy.js';

export class StripeStrategy extends PaymentStrategy {
  async process(amount, orderId) {
    try {
      console.log(`💳 Calango-food: Gerando PaymentIntent Stripe para Pedido ${orderId}`);
      
      return {
        success: true,
        transactionId: `STP-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
        gateway: 'stripe',
        status: 'pending'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}