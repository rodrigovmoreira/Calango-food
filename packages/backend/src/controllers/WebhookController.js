// packages/backend/src/controllers/WebhookController.js
import Order from '../models/Order.js';
import NotificationService from '../services/notifications/NotificationService.js';

class WebhookController {
  async handlePayment(req, res) {
    // SEGURANÇA: Validação de Token Simples para MVP
    // O token deve estar no seu .env e configurado na URL do Webhook no portal do PagBank/Stripe
    const { token } = req.query;
    if (token !== process.env.WEBHOOK_SECRET) {
      console.warn("🛡️ Tentativa de acesso não autorizado ao Webhook!");
      return res.status(403).json({ error: "Não autorizado" });
    }

    const { id, reference, status } = req.body;
    const transactionId = id || reference;

    try {
      const order = await Order.findOne({ 'payment.transactionId': transactionId });

      if (!order) {
        return res.status(404).send();
      }

      const isPaid = ['PAID', 'approved', 'succeeded', 'paid'].includes(status?.toUpperCase() || status);

      if (isPaid && order.payment.status !== 'paid') {
        order.payment.status = 'paid';
        order.delivery.status = 'preparing';
        order.history.push({ status: 'paid' });
        await order.save();

        await NotificationService.notifyNewOrderPaid(order);
      }

      const isFailed = ['DECLINED', 'CANCELED', 'expired'].includes(status?.toLowerCase());

      if (isFailed) {
        order.payment.status = 'failed';
        order.history.push({ status: 'payment_failed' });
        await order.save();
        // Notificar o cliente via WhatsApp: "Seu pagamento expirou, tente novamente."
      }

      res.status(200).json({ received: true });
    } catch (err) {
      res.status(500).send();
    }
  }
}

export default new WebhookController();