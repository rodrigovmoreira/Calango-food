// packages/backend/src/controllers/OrderController.js
import Order from '../models/Order.js';
import Product from '../models/Product.js'; // Importação vital para validação de preço
import { PaymentFactory } from '../services/payments/PaymentFactory.js';

class OrderController {

  async getOrders(req, res) {
    try {
      // Filtra por tenantId para garantir isolamento multi-tenant
      const orders = await Order.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
    }
  }
  
  async createOrder(req, res) {
    const { clientId, items, method, address } = req.body;
    const tenantId = req.tenantId; 

    let newOrder;
    let calculatedTotal = 0;
    const validatedItems = [];

    try {
      // 1. VALIDAÇÃO E CÁLCULO (Anti-Fraude): Não confiamos no 'total' vindo do front
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, tenantId });
        
        if (!product) {
          throw new Error(`Produto ${item.name} não disponível.`);
        }

        // Soma o preço base do produto
        let currentItemPrice = product.price;

        // Soma os opcionais dinâmicos (Bordas, Extras, Pontos da carne, etc)
        if (item.customizations && Array.isArray(item.customizations)) {
          item.customizations.forEach(opt => {
            currentItemPrice += (opt.extraPrice || 0);
          });
        }

        calculatedTotal += (currentItemPrice * item.quantity);
        
        validatedItems.push({
          productId: product._id,
          name: product.name,
          price: currentItemPrice,
          quantity: item.quantity,
          customizations: item.customizations || [] // Mantém a flexibilidade para qualquer restaurante
        });
      }

      // 2. Criação do Registro Inicial
      newOrder = await Order.create({
        tenantId,
        clientId,
        items: validatedItems,
        total: calculatedTotal,
        payment: { 
          method, 
          status: 'pending' 
        },
        delivery: { address }
      });

      // 3. Processamento via Strategy Pattern
      const processor = PaymentFactory.create(method);
      const paymentResult = await processor.process(calculatedTotal, newOrder._id);

      if (!paymentResult.success) {
        newOrder.payment.status = 'failed';
        newOrder.payment.failureMessage = paymentResult.error || 'Transação recusada.';
        await newOrder.save();

        return res.status(402).json({
          status: 'fail',
          message: 'Pagamento não autorizado.',
          error: newOrder.payment.failureMessage
        });
      }

      // 4. Sucesso no processamento e registro do Gateway
      newOrder.payment.transactionId = paymentResult.transactionId;
      newOrder.payment.gatewayProvider = paymentResult.gateway; // PagBank ou Stripe
      newOrder.history.push({ status: 'pending' });
      await newOrder.save();

      res.status(201).json({
        orderId: newOrder._id,
        paymentData: paymentResult // Retorna QR Code ou dados necessários para o cliente pagar
      });

    } catch (error) {
      console.error("❌ Erro Crítico no Pedido:", error.message);
      
      if (newOrder) {
        newOrder.payment.status = 'failed';
        newOrder.payment.failureMessage = error.message;
        await newOrder.save();
      }
      
      res.status(500).json({ 
        error: "Falha ao processar pedido", 
        details: error.message 
      });
    }
  }
}

export default new OrderController();