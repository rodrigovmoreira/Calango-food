import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  clientId: { type: String, required: true },
  customerName: { type: String, default: 'Visitante' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId },
    name: String,
    price: Number,
    quantity: Number,
    customizations: [{
      name: String,
      price: Number
    }]
  }],
  total: { type: Number, required: true },
  payment: {
    method: { type: String, enum: ['pix', 'card'], required: true },
    status: { type: String, default: 'pending' },
    transactionId: String,
    gatewayProvider: { type: String, enum: ['pagbank', 'stripe', 'pix_internal'], default: 'pagbank' },
    failureMessage: String
  },
  delivery: {
    type: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    address: { type: String, required: true },
    reference: { type: String },
    status: { type: String, default: 'awaiting_payment' }
  },
  // NOVO: Histórico de status para o "Acompanhamento do Pedido"
  history: [{
    status: String,
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);