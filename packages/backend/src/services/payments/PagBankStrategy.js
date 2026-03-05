import { PaymentStrategy } from './PaymentStrategy.js';

export class PagBankStrategy extends PaymentStrategy {
  async process(amount, orderId) {
    // Aqui usamos o Padrão Adapter se a biblioteca do PagBank for complexa
    console.log(`Iniciando checkout PagBank para o pedido ${orderId}`);
    
    return {
      success: true,
      method: 'CREDIT_CARD',
      checkoutUrl: "https://pagseguro.uol.com.br/checkout/...", 
      status: 'waiting_payment'
    };
  }
}