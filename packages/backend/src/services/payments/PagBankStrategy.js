import { PaymentStrategy } from './PaymentStrategy.js';

export class PagBankStrategy extends PaymentStrategy {
  async process(amount, orderId) {
    try {
      // Aqui entrará a chamada de fetch/axios para a API do PagBank
      console.log(`🐊 Calango-food: Iniciando Checkout PagBank para Pedido ${orderId}`);
      
      // Simulação de resposta da API
      return {
        success: true,
        transactionId: `PGB-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
        gateway: 'pagbank',
        status: 'pending' // PagBank geralmente aguarda o webhook para confirmar
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}