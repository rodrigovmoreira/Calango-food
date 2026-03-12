import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  clientId: { type: String, required: true },
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: { type: Number, required: true },
  payment: {
    method: { type: String, enum: ['pix', 'card'], required: true },
    status: { type: String, default: 'pending' },
    transactionId: String,
    // NOVO: Identifica qual API processou a venda (PagBank ou Stripe)
    gatewayProvider: { type: String, enum: ['pagbank', 'stripe', 'pix_internal'], default: 'pagbank' },
    // NOVO: Armazena o log de erro se a transação falhar
    failureMessage: String
  },
  delivery: {
    address: { type: String, required: true },
    status: { type: String, default: 'awaiting_payment' }
  },
  // NOVO: Histórico de status para o "Acompanhamento do Pedido"
  history: [{
    status: String,
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);