import { PaymentStrategy } from './PaymentStrategy.js';

export class PixStrategy extends PaymentStrategy {
  async process(amount, orderId) {
    // Aqui entraria a chamada para sua API de PIX (Asaas, Efí, etc)
    console.log(`Gerando PIX de R$ ${amount} para o pedido ${orderId}`);
    
    return {
      success: true,
      method: 'PIX',
      qrCode: "000201...", // Payload do PIX copia e cola
      status: 'pending'
    };
  }
}