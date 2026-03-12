import { PixStrategy } from './PixStrategy.js';
import { PagBankStrategy } from './PagBankStrategy.js';
import { StripeStrategy } from './StripeStrategy.js';

export class PaymentFactory {

  // Cria a estratégia de pagamento baseada no método ou provedor específico.
  // @param {string} method - O método (pix, card, pagbank, stripe)
  static create(method) {
    const sanitizedMethod = method.toLowerCase();

    switch (sanitizedMethod) {
      case 'pix':
        return new PixStrategy();

      // Permite chamar o gateway específico diretamente
      case 'stripe':
        return new StripeStrategy();

      case 'pagbank':
        return new PagBankStrategy();

      // Caso o frontend envie apenas 'card', definimos um padrão (ex: PagBank pelas taxas menores no BR)
      case 'card':
        console.log('🐊 Calango-food: Usando PagBank como provedor padrão de cartão.');
        return new PagBankStrategy();

      default:
        throw new Error(`O método de pagamento "${method}" não é suportado pelo Calango-food.`);
    }
  }
}