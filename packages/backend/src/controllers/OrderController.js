import Order from '../models/Order.js';
import { PaymentFactory } from '../services/payments/PaymentFactory.js';

class OrderController {
  /**
   * Lista apenas os pedidos do restaurante logado (Tenant Isolation)
   */
  async getOrders(req, res) {
    try {
      // O req.tenantId vem do middleware protect
      const orders = await Order.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
    }
  }

  /**
   * Cria um novo pedido vinculado ao tenantId do usuário logado
   */
  async createOrder(req, res) {
    // Agora o tenantId vem do Token decodificado, não precisa vir no body
    const { clientId, items, total, method, address } = req.body;
    const tenantId = req.tenantId; 
    
    try {
      // 1. Persistência vinculada ao ID do usuário atual
      const newOrder = await Order.create({
        tenantId, // ID do restaurante logado
        clientId,
        items,
        total,
        payment: { method },
        delivery: { address }
      });

      // 2. Uso do Design Pattern Factory para processar pagamento
      const processor = PaymentFactory.create(method);
      const paymentResult = await processor.process(total, newOrder._id);

      // 3. Atualiza o pedido com os dados de pagamento
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