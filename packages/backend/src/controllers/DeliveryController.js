import DeliveryDriver from '../models/DeliveryDriver.js';
import WazeAdapter from '../adapters/WazeAdapter.js';

import Order from '../models/Order.js';
import WppService from '../services/notifications/WppService.js';

class DeliveryController {
  // Lista motoboys do restaurante logado
  async listDrivers(req, res) {
    try {
      const tenantId = req.tenantId || req.query.tenantId; // Protegido
      const drivers = await DeliveryDriver.find({ tenantId, isActive: true }).sort({ priority: -1 });
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar motoboys" });
    }
  }

  // Gera a rota e prepara a mensagem (O coração do MVP)
  async dispatchOrder(req, res) {
    try {
      const tenantId = req.tenantId; // Vem do token da loja no Kitchen.jsx
      const { orderId, address, restaurantAddress = 'Av. Principal, 1000' } = req.body;

      // 1. Busca o pedido para pegar info do cliente e atualizar status
      const order = await Order.findOne({ _id: orderId, tenantId });
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado." });
      }

      // 2. Busca o próximo motoboy disponível por prioridade
      const driver = await DeliveryDriver.findOne({ 
        tenantId, 
        status: 'disponivel' 
      }).sort({ priority: -1 });

      if (!driver) {
        return res.status(404).json({ message: "Nenhum motoboy disponível no momento." });
      }

      // 3. Usa o Adapter para gerar os links (Determinístico)
      const linkLoja = WazeAdapter.generateRouteLink(restaurantAddress);
      const linkCliente = WazeAdapter.generateRouteLink(address);
      const messageTemplate = `📦 *Nova Entrega!*\n\n📍 *Retirada:* ${linkLoja}\n🏁 *Entrega:* ${linkCliente}`;

      // 4. Dispara WhatsApp para o Motoboy
      await WppService.sendMessage(tenantId, driver.whatsapp, messageTemplate);

      // 5. Atualiza o status do pedido para "saiu para entrega"
      order.delivery.status = 'dispatched';
      order.history.push({ status: 'dispatched' });
      await order.save();

      // 6. Avisar o cliente
      await WppService.sendMessage(tenantId, order.clientId, `🛵 *Calango Delivery*\n\nOba! Seu pedido saiu para entrega.\nO motoboy *${driver.name}* já está a caminho!`);

      // 7. Retorna os dados
      res.json({
        driverName: driver.name,
        dispatched: true,
      });

    } catch (error) {
      console.error("Falha ao despachar:", error);
      res.status(500).json({ error: "Falha ao despachar pedido" });
    }
  }

  // Cria um novo motoboy
  async createDriver(req, res) {
    try {
      const tenantId = req.tenantId;
      const { name, whatsapp, status, priority } = req.body;
      
      if (!name || !whatsapp) {
        return res.status(400).json({ message: "Nome e WhatsApp são obrigatórios." });
      }

      const driver = new DeliveryDriver({
        tenantId,
        name,
        whatsapp,
        status: status || 'offline',
        priority: priority || 0
      });

      await driver.save();
      res.status(201).json(driver);
    } catch (error) {
      console.error("Erro ao criar motoboy:", error);
      res.status(500).json({ error: "Erro ao criar motoboy" });
    }
  }

  // Atualiza os dados do motoboy (status, priority, etc)
  async updateDriver(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      
      const driver = await DeliveryDriver.findOneAndUpdate(
        { _id: id, tenantId },
        { ...req.body },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({ message: "Motoboy não encontrado." });
      }

      res.json(driver);
    } catch (error) {
      console.error("Erro ao atualizar motoboy:", error);
      res.status(500).json({ error: "Erro ao atualizar motoboy" });
    }
  }

  // Desativa ou deleta logicamente o motoboy
  async deleteDriver(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const driver = await DeliveryDriver.findOneAndUpdate(
        { _id: id, tenantId },
        { isActive: false },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({ message: "Motoboy não encontrado." });
      }

      res.json({ message: "Motoboy removido com sucesso.", driver });
    } catch (error) {
      console.error("Erro ao remover motoboy:", error);
      res.status(500).json({ error: "Erro ao remover motoboy" });
    }
  }
}

export default new DeliveryController();