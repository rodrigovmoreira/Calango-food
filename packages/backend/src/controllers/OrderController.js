// packages/backend/src/controllers/OrderController.js
import Order from '../models/Order.js';
import { PaymentFactory } from '../services/payments/PaymentFactory.js';

class OrderController {

  async getOrders(req, res) {
    try {
      // O req.tenantId vem do middleware protect
      const orders = await Order.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
    }
  }
  
  async createOrder(req, res) {
    const { clientId, items, total, method, address } = req.body;
    const tenantId = req.tenantId; // Injetado pelo middleware protect

    let newOrder;

    try {
      // 1. Cria o registro do pedido com status inicial 'pending'
      newOrder = await Order.create({
        tenantId,
        clientId,
        items,
        total,
        payment: { method, status: 'pending' },
        delivery: { address }
      });

      // 2. Instancia o gateway configurado para o restaurante
      const processor = PaymentFactory.create(method);

      // 3. Tenta processar o pagamento
      const paymentResult = await processor.process(total, newOrder._id);

      if (!paymentResult.success) {
        // TRATAMENTO DE EXCEÇÃO: Se o gateway retornar erro (cartão recusado, etc)
        newOrder.payment.status = 'failed';
        newOrder.payment.failureMessage = paymentResult.error || 'Transação recusada pelo emissor.';
        await newOrder.save();

        return res.status(402).json({
          status: 'fail',
          message: 'Pagamento não autorizado.',
          error: newOrder.payment.failureMessage
        });
      }

      // 4. Sucesso no processamento inicial (aguardando confirmação do webhook)
      newOrder.payment.transactionId = paymentResult.transactionId;
      newOrder.payment.gatewayProvider = paymentResult.gateway;
      newOrder.history.push({ status: 'pending' });
      await newOrder.save();

      res.status(201).json({
        orderId: newOrder._id,
        paymentData: paymentResult
      });

    } catch (error) {
      // Erro inesperado (banco de dados ou falha de rede)
      if (newOrder) {
        newOrder.payment.status = 'failed';
        newOrder.payment.failureMessage = 'Erro interno ao processar pedido.';
        await newOrder.save();
      }
      res.status(500).json({ error: "Falha crítica no checkout. Tente novamente." });
    }
  }
}

export default new OrderController();