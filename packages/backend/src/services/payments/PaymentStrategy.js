// Interface básica para garantir que todo provedor tenha o método process
export class PaymentStrategy {
  async process(amount, orderId) {
    throw new Error("O método process deve ser implementado.");
  }
}