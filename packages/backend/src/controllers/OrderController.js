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
    const { slug, clientId, customerName, items, payment, delivery, tenantId } = req.body;
    
    // Fallback de tenantId se a rota for usada internamente sem slug
    let finalTenantId = tenantId || req.tenantId;

    if (slug) {
      const SystemUser = (await import('../models/SystemUser.js')).default;
      let user;
      if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        user = await SystemUser.findById(slug);
      } else {
        user = await SystemUser.findOne({ slug });
      }
      if (!user) return res.status(404).json({ error: 'Restaurante não encontrado pelo slug.' });
      
      if (!user.isOpen) {
         return res.status(400).json({ error: 'Desculpe, a loja está fechada no momento.' });
      }
      finalTenantId = user._id;
    }

    if (!finalTenantId) {
      return res.status(400).json({ error: 'slug ou tenantId é obrigatório' });
    }

    // NOVA VALIDAÇÃO (se o fallback foi usado sem slug)
    try {
      if (!slug) {
        const user = await import('../models/SystemUser.js').then(m => m.default).then(SystemUser => SystemUser.findById(finalTenantId));
        if (user && !user.isOpen) {
           return res.status(400).json({ error: 'Desculpe, a loja está fechada no momento.' });
        }
      }
    } catch (err) {
      console.error("Erro ao checar status da loja", err);
    }

    let newOrder;
    let calculatedTotal = 0;
    const validatedItems = [];

    try {
      // 1. VALIDAÇÃO E CÁLCULO (Anti-Fraude): Não confiamos no 'total'
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, tenantId: finalTenantId });
        
        if (!product) {
          throw new Error(`Produto ${item.name} não disponível.`);
        }

        let currentItemPrice = product.price;
        let customPrice = 0;
        const finalCustomizations = [];

        if (item.customizations && Array.isArray(item.customizations)) {
          const groupedCustomizations = {};
          
          for (const opt of item.customizations) {
            // Descobre a qual grupo essa opção pertence dinamicamente
            let foundGroupName = 'Diversos'; // Fallback
            for (const g of product.attributeGroups) {
               if (g.options.some(o => o.name === opt.name)) {
                 foundGroupName = g.name;
                 break;
               }
            }
            if (!groupedCustomizations[foundGroupName]) {
              groupedCustomizations[foundGroupName] = [];
            }
            groupedCustomizations[foundGroupName].push(opt);
          }

          // Para cada grupo detectado, aplicamos a pricing strategy do banco
          for (const [groupName, selectedOpts] of Object.entries(groupedCustomizations)) {
            const groupDef = product.attributeGroups.find(g => g.name === groupName);
            
            if (groupDef) {
              const pricesForGroup = [];
              const groupSelections = [];

              for (const opt of selectedOpts) {
                const optionDef = groupDef.options.find(o => o.name === opt.name);
                if (optionDef) {
                  pricesForGroup.push(optionDef.price);
                  groupSelections.push({
                    name: optionDef.name,
                    price: optionDef.price // salva o preço real do banco
                  });
                }
              }

              let groupTotal = 0;
              if (pricesForGroup.length > 0) {
                if (groupDef.pricingStrategy === 'HIGHEST') {
                  groupTotal = Math.max(...pricesForGroup);
                } else if (groupDef.pricingStrategy === 'AVERAGE') {
                  const sum = pricesForGroup.reduce((a, b) => a + b, 0);
                  groupTotal = sum / pricesForGroup.length; 
                } else {
                  groupTotal = pricesForGroup.reduce((a, b) => a + b, 0);
                }
              }

              customPrice += groupTotal;
              finalCustomizations.push(...groupSelections);
            }
          }
        }

        currentItemPrice += customPrice;
        calculatedTotal += (currentItemPrice * item.quantity);
        
        validatedItems.push({
          productId: product._id,
          name: product.name,
          price: currentItemPrice,
          quantity: item.quantity,
          customizations: finalCustomizations
        });
      }

      const methodToUse = payment?.method || req.body.method || 'pix';
      const addressToUse = delivery?.address || req.body.address;

      // 2. Criação do Registro Inicial
      newOrder = await Order.create({
        tenantId: finalTenantId,
        clientId,
        customerName: customerName || 'Visitante',
        items: validatedItems,
        total: calculatedTotal,
        payment: { 
          method: methodToUse, 
          status: 'pending' 
        },
        delivery: { 
          type: delivery?.type || 'delivery',
          address: addressToUse,
          reference: delivery?.reference || ''
        }
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

      // Dispara mensagem WhatsApp de confirmação de recebimento do pedido
      try {
        import('../services/notifications/WppService.js').then(({ default: WppService }) => {
           WppService.sendMessage(
             finalTenantId, 
             clientId, // Aqui assumimos que clientId é o WhatsApp do cliente salvo sem formatação extra (apenas número)
             `✅ *Calango Delivery*\n\nSeu pedido foi recebido com sucesso!\n\n*Total:* R$ ${calculatedTotal.toFixed(2)}\n*Entrega:* ${address}\n\nAcompanhe seu pedido quando quiser.`
           );
        });
      } catch (wppError) {
        console.error("Erro ao enviar WPP inicial:", wppError);
      }

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