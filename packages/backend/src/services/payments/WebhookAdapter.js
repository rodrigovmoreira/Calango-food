// packages/backend/src/services/payments/WebhookAdapter.js

export class WebhookAdapter {
  static transform(payload, provider) {
    switch (provider) {
      case 'stripe':
        return {
          transactionId: payload.id || payload.data?.object?.id,
          status: payload.type === 'payment_intent.succeeded' ? 'paid' : 'failed',
          amount: payload.data?.object?.amount / 100, // Stripe usa centavos
          provider: 'stripe'
        };

      case 'pagbank':
        return {
          transactionId: payload.charges?.[0]?.id,
          status: payload.charges?.[0]?.status === 'PAID' ? 'paid' : 'failed',
          amount: payload.charges?.[0]?.amount?.value / 100,
          provider: 'pagbank'
        };

      default:
        throw new Error(`Provedor de webhook desconhecido: ${provider}`);
    }
  }
}