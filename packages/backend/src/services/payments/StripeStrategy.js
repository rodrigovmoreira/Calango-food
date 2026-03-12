import { PaymentStrategy } from './PaymentStrategy.js';

export class StripeStrategy extends PaymentStrategy {
  async process(amount, orderId) {
    // Aqui entraria a lógica real da API do Stripe
    console.log(`💳 Processando R$ ${amount} via Stripe para o pedido ${orderId}`);
    
    // Simulação de retorno padronizado
    return {
      success: true,
      transactionId: `st_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    };
  }
}