import DeliveryDriver from '../models/DeliveryDriver.js';
import WazeAdapter from '../adapters/WazeAdapter.js';

import Order from '../models/Order.js';
import WppService from '../services/notifications/WppService.js';

class DeliveryController {
  // Lista entregadores do restaurante logado (Todos, incluindo inativos)
  async listDrivers(req, res) {
    try {
      const tenantId = req.tenantId || req.query.tenantId; // Protegido
      const drivers = await DeliveryDriver.find({ tenantId }).sort({ priority: -1 });
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar entregadores" });
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

      // 2. Busca o próximo entregador disponível e ativo por prioridade
      const driver = await DeliveryDriver.findOne({
        tenantId,
        status: 'disponivel',
        isActive: { $ne: false } // Garante que o entregador não está inativado
      }).sort({ priority: -1 });

      if (!driver) {
        return res.status(404).json({ message: "Nenhum entregador disponível no momento." });
      }

      // 3. Usa o Adapter para gerar os links (Determinístico)
      const linkLoja = WazeAdapter.generateRouteLink(restaurantAddress);
      const linkCliente = WazeAdapter.generateRouteLink(address);
      const messageTemplate = `📦 *Nova Entrega!*\n\n📍 *Retirada:* ${linkLoja}\n🏁 *Entrega:* ${linkCliente}`;

      // 4. Dispara WhatsApp para o Entregador
      await WppService.sendMessage(tenantId, driver.whatsapp, messageTemplate);

      // 5. Atualiza o status do pedido para "saiu para entrega"
      order.delivery.status = 'dispatched';
      order.history.push({ status: 'dispatched' });
      await order.save();

      // 6. Avisar o cliente
      await WppService.sendMessage(tenantId, order.clientId, `🛵 *Calango Delivery*\n\nOba! Seu pedido saiu para entrega.\nO entregador *${driver.name}* já está a caminho!`);

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

  // Cria um novo entregador
  async createDriver(req, res) {
    try {
      const tenantId = req.tenantId;
      const { name, whatsapp, status, priority, isActive } = req.body;

      if (!name || !whatsapp) {
        return res.status(400).json({ message: "Nome e WhatsApp são obrigatórios." });
      }

      // Check for duplicate WhatsApp number in the same tenant
      const existingDriver = await DeliveryDriver.findOne({ tenantId, whatsapp });
      if (existingDriver) {
        return res.status(400).json({ message: "Já existe um entregador cadastrado com este número de WhatsApp." });
      }

      const driver = new DeliveryDriver({
        tenantId,
        name,
        whatsapp,
        status: status || 'offline',
        priority: priority || 0,
        isActive: isActive !== undefined ? isActive : true
      });

      await driver.save();
      res.status(201).json(driver);
    } catch (error) {
      console.error("Erro ao criar entregador:", error);
      res.status(500).json({ error: "Erro ao criar entregador" });
    }
  }

  // Atualiza os dados do entregador (status, priority, etc)
  async updateDriver(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      // Se estiver atualizando o whatsapp, verifica se já não existe outro com o mesmo número
      if (req.body.whatsapp) {
        const existingDriver = await DeliveryDriver.findOne({ 
          tenantId, 
          whatsapp: req.body.whatsapp,
          _id: { $ne: id } // Exclui o próprio entregador da busca
        });
        
        if (existingDriver) {
          return res.status(400).json({ message: "Este número de WhatsApp já está sendo usado por outro entregador." });
        }
      }

      const driver = await DeliveryDriver.findOneAndUpdate(
        { _id: id, tenantId },
        { ...req.body },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({ message: "Entregador não encontrado." });
      }

      res.json(driver);
    } catch (error) {
      console.error("Erro ao atualizar entregador:", error);
      res.status(500).json({ error: "Erro ao atualizar entregador" });
    }
  }

  // Deleta o entregador definitivamente do banco de dados
  async deleteDriver(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const driver = await DeliveryDriver.findOneAndDelete({ _id: id, tenantId });

      if (!driver) {
        return res.status(404).json({ message: "Entregador não encontrado." });
      }

      res.json({ message: "Entregador removido com sucesso.", driver });
    } catch (error) {
      console.error("Erro ao remover entregador:", error);
      res.status(500).json({ error: "Erro ao remover entregador" });
    }
  }
}

export default new DeliveryController();