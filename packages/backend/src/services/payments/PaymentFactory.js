import { PixStrategy } from './PixStrategy.js';
import { PagBankStrategy } from './PagBankStrategy.js';

export class PaymentFactory {
  static create(method) {
    switch (method) {
      case 'pix':
        return new PixStrategy();
      case 'card':
        return new PagBankStrategy();
      default:
        throw new Error("Método de pagamento não suportado.");
    }
  }
}