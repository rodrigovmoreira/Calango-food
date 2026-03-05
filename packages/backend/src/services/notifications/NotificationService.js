import WppService from './WppService.js';

class NotificationService {
  /**
   * Disparado quando o Webhook confirma o pagamento (Etapa 1)
   */
  async notifyNewOrderPaid(order) {
    const restaurantMsg = `🔔 *NOVO PEDIDO PAGO!*\n\n💰 Valor: R$ ${order.total.toFixed(2)}\n📍 Endereço: ${order.delivery.address}\n\nO pedido já está disponível no seu painel para preparo.`;
    
    const clientMsg = `✅ *Pagamento Confirmado!*\n\nSeu pedido na *Calango-food* já está na cozinha. Avisaremos você assim que o motoboy sair!`;

    try {
      // Notifica o restaurante (Número vindo do process.env ou do Tenant)
      await WppService.sendMessage(process.env.RESTAURANTE_WHATSAPP, restaurantMsg);
      // Notifica o cliente (ID do cliente é o WhatsApp dele)
      await WppService.sendMessage(order.clientId, clientMsg);
    } catch (err) {
      console.error("Erro ao enviar notificações de pedido:", err);
    }
  }
}

export default new NotificationService();