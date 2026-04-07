import axios from 'axios';

// Utiliza a URL do ambiente ou aponta para o servidor local por padrão
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3010';

export class GatewayService {
  /**
   * Envia a intenção de pagamento para o Calango Gateway
   * @param {Object} order - O documento do pedido (Order Model)
   * @param {Object} credentials - As chaves de API do lojista (Tenant)
   * @returns {Promise<Object>} Resposta padronizada (Calango Standard)
   */
  static async solicitarPagamento(order, credentials) {
    try {
      console.log(`\x1b[36m%s\x1b[0m`, `📡 [Calango Food] Solicitando pagamento ao Gateway | Pedido: ${order._id}`);

      const payload = {
        tenantId: order.tenantId,
        amount: order.total,
        orderId: order._id,
        method: order.payment.method,
        credentials: credentials || {} // Enviado Just-in-Time para manter o Gateway stateless
      };

      const response = await axios.post(`${GATEWAY_URL}/v1/payments/create`, payload, {
        timeout: 10000, // Timeout de 10 segundos: evita que o cliente fique travado na tela de loading
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`\x1b[32m%s\x1b[0m`, `✅ [Calango Food] Resposta do Gateway recebida (Transação: ${response.data.transactionId})`);
      return response.data; 

    } catch (error) {
      // 1. O Gateway respondeu, mas com um erro de negócio (ex: 400 Falta de campo, 402 Cartão Recusado)
      if (error.response) {
        console.error(`❌ [Calango Food] Gateway recusou a transação:`, error.response.data);
        throw new Error(error.response.data.error || error.response.data.message || 'Pagamento não autorizado pelo provedor.');
      } 
      
      // 2. A requisição foi feita, mas o Gateway não respondeu (Servidor local desligado, PM2 reiniciando, etc)
      else if (error.request) {
        console.error(`🚨 [Calango Food] Gateway Inacessível. A porta 3010 está respondendo?`);
        throw new Error('O serviço de pagamentos está temporariamente indisponível. Tente novamente em alguns instantes.');
      } 
      
      // 3. Algum erro interno na montagem do payload pelo Axios
      else {
        console.error(`❌ [Calango Food] Erro interno na comunicação:`, error.message);
        throw new Error('Falha interna ao preparar a comunicação de pagamento.');
      }
    }
  }
}