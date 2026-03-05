import Order from '../models/Order.js';
import { PaymentFactory } from '../services/payments/PaymentFactory.js';

class OrderController {
  async createOrder(req, res) {
    const { tenantId, clientId, items, total, method, address } = req.body;
    
    try {
      // 1. Persistência inicial no MongoDB
      const newOrder = await Order.create({
        tenantId,
        clientId,
        items,
        total,
        payment: { method },
        delivery: { address }
      });

      // 2. Uso do Design Pattern Factory para processar pagamento
      const processor = PaymentFactory.create(method);
      const paymentResult = await processor.process(total, newOrder._id);

      // 3. Atualiza o pedido com o ID da transação (TXID do PIX ou ID do PagBank)
      newOrder.payment.transactionId = paymentResult.transactionId || paymentResult.qrCode;
      await newOrder.save();

      res.status(201).json({
        orderId: newOrder._id,
        paymentData: paymentResult
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new OrderController();