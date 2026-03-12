// packages/backend/src/services/payments/PaymentStrategy.js
export class PaymentStrategy {
  /**
   * @param {number} amount - Valor total
   * @param {string} orderId - ID do pedido no MongoDB
   * @returns {Promise<{success: boolean, transactionId: string, gateway: string, status: string, qrCode?: string}>}
   */
  async process(amount, orderId) {
    throw new Error("O método process() deve ser implementado pelas subclasses.");
  }
}