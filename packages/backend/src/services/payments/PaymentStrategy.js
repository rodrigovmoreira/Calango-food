/**
 * Interface Base para Estratégias de Pagamento.
 * Define o contrato que todos os gateways (Stripe, PagBank, Pix) devem seguir. [cite: 5, 25]
 */
export class PaymentStrategy {
  /**
   * Método obrigatório para processar um pagamento.
   * @param {number} amount - Valor total da transação.
   * @param {string} orderId - ID de referência do pedido no MongoDB.
   * @returns {Promise<{
   * success: boolean, 
   * transactionId: string, 
   * gateway: string, 
   * status: string, 
   * qrCode?: string,
   * copyPaste?: string
   * }>} Retorno padronizado para o OrderController. [cite: 19, 21]
   */
  async process(amount, orderId) {
    // LUTA ATIVA contra implementações incompletas: 
    // Se uma subclasse esquecer de implementar, o sistema trava aqui com erro claro. [cite: 10, 11]
    throw new Error(
      `Erro Crítico: O método process() não foi implementado na estratégia de pagamento atual para o pedido ${orderId}.`
    );
  }
}