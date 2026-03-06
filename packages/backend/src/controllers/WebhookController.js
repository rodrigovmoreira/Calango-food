import Order from '../models/Order.js';
import NotificationService from '../services/notifications/NotificationService.js';

class WebhookController {
  /**
   * handlePayment
   * Recebe a notificação das APIs de pagamento (PagBank, PIX, etc.)
   * Atualiza o banco de dados e dispara as notificações automáticas.
   */
  async handlePayment(req, res) {
    try {
      // O corpo (body) depende da API escolhida, mas o padrão Strategy 
      // garante que buscaremos pelo transactionId (ou txid no PIX)
      const { transactionId, status } = req.body; 

      if (!transactionId) {
        return res.status(400).json({ error: "Transaction ID não informado" });
      }

      // 1. Localiza o pedido no MongoDB através do ID da transação
      const order = await Order.findOne({ "payment.transactionId": transactionId });

      if (!order) {
        console.error(`[Webhook] Pedido não encontrado para ID: ${transactionId}`);
        return res.status(404).json({ message: "Pedido não encontrado." });
      }

      // 2. Verifica se o pagamento foi aprovado (status depende da API, ex: 'PAID' ou 'success')
      const paymentSuccessful = ['PAID', 'success', 'approved', '6'].includes(status);

      if (paymentSuccessful) {
        // Evita processar novamente se já estiver pago
        if (order.payment.status === 'paid') {
          return res.status(200).send("OK (Já processado)");
        }

        // Atualiza o status do pagamento e da logística
        order.payment.status = 'paid';
        order.delivery.status = 'preparing'; 
        await order.save();

        console.log(`💰 Pedido ${order._id} CONFIRMADO e movido para Cozinha.`);

        // 3. Notificações via WhatsApp (Independente/WppService)
        // Dispara para o restaurante e para o cliente conforme definido na Etapa 2
        await NotificationService.notifyNewOrderPaid(order);
      } else {
        console.log(`⚠️ Webhook recebeu status não aprovado: ${status} para o pedido ${order._id}`);
      }

      // O Webhook deve sempre retornar 200/OK para a API de pagamento parar de reenviar
      res.status(200).send("OK");

    } catch (error) {
      console.error("❌ Erro no processamento do Webhook:", error);
      res.status(500).json({ error: "Erro interno no processamento do pagamento" });
    }
  }
}

export default new WebhookController();