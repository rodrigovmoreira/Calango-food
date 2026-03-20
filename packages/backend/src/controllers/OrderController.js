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
    // Para rota pública, tenantId vem do body
    const { clientId, items, method, address, tenantId } = req.body;
    
    // Fallback caso a rota permaneça protegida para algum admin
    const finalTenantId = tenantId || req.tenantId;

    if (!finalTenantId) {
      return res.status(400).json({ error: 'tenantId é obrigatório' });
    }

    // NOVA VALIDAÇÃO: Bloqueia se a loja estiver fechada administrativamente
    try {
      const user = await import('../models/SystemUser.js').then(m => m.default).then(SystemUser => SystemUser.findById(finalTenantId));
      if (user && !user.isOpen) {
         return res.status(400).json({ error: 'Desculpe, a loja está fechada no momento.' });
      }
    } catch (err) {
      console.error("Erro ao checar status da loja", err);
    }

    let newOrder;
    let calculatedTotal = 0;
    const validatedItems = [];

    try {
      // 1. VALIDAÇÃO E CÁLCULO (Anti-Fraude): Não confiamos no 'total' vindo do front
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, tenantId: finalTenantId });
        
        if (!product) {
          throw new Error(`Produto ${item.name} não disponível.`);
        }

        // Soma o preço base do produto
        let currentItemPrice = product.price;

        // Soma os opcionais dinâmicos com Responsabilidade Extrema (valida pelo Banco de Dados)
        let customPrice = 0;
        const finalCustomizations = [];

        if (item.customizations && Array.isArray(item.customizations)) {
          // Agrupa as customizações pelo nome do grupo a qual pertencem
          // Ex: { "Escolha seus Sabores": ["Calabresa", "Mussarela"] }
          const groupedCustomizations = {};
          
          for (const opt of item.customizations) {
            // Cada opt precisa informar a qual grupo ele pertence e seu nome
            const groupName = opt.groupName;
            if (!groupedCustomizations[groupName]) {
              groupedCustomizations[groupName] = [];
            }
            groupedCustomizations[groupName].push(opt);
          }

          // Para cada grupo enviado, vamos calcular com base na regra definida no banco
          for (const [groupName, selectedOpts] of Object.entries(groupedCustomizations)) {
            // Encontra o grupo no banco
            const groupDef = product.attributeGroups.find(g => g.name === groupName);
            
            if (groupDef) {
              const pricesForGroup = [];
              const groupSelections = [];

              for (const opt of selectedOpts) {
                // Encontra a opção real dentro do grupo
                const optionDef = groupDef.options.find(o => o.name === opt.name);
                if (optionDef) {
                  pricesForGroup.push(optionDef.price);
                  groupSelections.push({
                    groupName: groupDef.name,
                    name: optionDef.name,
                    price: optionDef.price // salva o preço real do banco
                  });
                }
              }

              // Aplica a estratégia de preço (pricingStrategy) do grupo: SUM, HIGHEST, AVERAGE
              let groupTotal = 0;
              if (pricesForGroup.length > 0) {
                if (groupDef.pricingStrategy === 'HIGHEST') {
                  groupTotal = Math.max(...pricesForGroup);
                } else if (groupDef.pricingStrategy === 'AVERAGE') {
                  const sum = pricesForGroup.reduce((a, b) => a + b, 0);
                  groupTotal = sum / groupDef.maxOptions; // Ex para Proporcional/Média
                  // Obs: usualmente pizza meia a meia proporcional divide pelas escolhas maxOptions ou length.
                  // Se escolher 2 de maxOptions=2, divide por 2. 
                  // Usaremos length para dividir o valor pelas quantias de escolhas atuais desse grupo.
                  groupTotal = sum / pricesForGroup.length; 
                } else {
                  // SUM (padrão)
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
          customizations: finalCustomizations // Array seguro, preços reais
        });
      }

      // 2. Criação do Registro Inicial
      newOrder = await Order.create({
        tenantId: finalTenantId,
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