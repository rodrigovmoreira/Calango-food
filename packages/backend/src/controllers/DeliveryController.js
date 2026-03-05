import DeliveryDriver from '../models/DeliveryDriver.js';
import WazeAdapter from '../adapters/WazeAdapter.js';

class DeliveryController {
  // Lista motoboys do restaurante logado
  async listDrivers(req, res) {
    try {
      const { tenantId } = req.query; // No futuro vira middleware de auth
      const drivers = await DeliveryDriver.find({ tenantId }).sort({ priority: -1 });
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar motoboys" });
    }
  }

  // Gera a rota e prepara a mensagem (O coração do MVP)
  async dispatchOrder(req, res) {
    try {
      const { tenantId, address, restaurantAddress } = req.body;

      // 1. Busca o próximo motoboy disponível por prioridade
      const driver = await DeliveryDriver.findOne({ 
        tenantId, 
        status: 'disponivel' 
      }).sort({ priority: -1 });

      if (!driver) {
        return res.status(404).json({ message: "Nenhum motoboy disponível no momento." });
      }

      // 2. Usa o Adapter para gerar os links (Determinístico)
      const linkLoja = WazeAdapter.generateRouteLink(restaurantAddress);
      const linkCliente = WazeAdapter.generateRouteLink(address);

      // 3. Retorna os dados para o trigger de WhatsApp (Calango Bot style)
      res.json({
        driverName: driver.name,
        driverPhone: driver.whatsapp,
        routeToStore: linkLoja,
        routeToClient: linkCliente,
        messageTemplate: `📦 *Nova Entrega!*\n\n📍 *Retirada:* ${linkLoja}\n🏁 *Entrega:* ${linkCliente}`
      });

    } catch (error) {
      res.status(500).json({ error: "Falha ao despachar pedido" });
    }
  }
}

export default new DeliveryController();