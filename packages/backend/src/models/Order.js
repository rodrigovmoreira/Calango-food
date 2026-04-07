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
    qrCode: String,        // NOVO: Salva o payload do QR Code vindo do Gateway
    copyPaste: String,     // NOVO: Salva a linha digitável do Pix
    gatewayProvider: { type: String }, // ALTERADO: Enum removido. O Food aceita qualquer provedor que o Gateway usar.
    failureMessage: String
  },
  delivery: {
    type: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    address: { type: String, required: true },
    cep: { type: String },
    number: { type: String },
    complement: { type: String },
    neighborhood: { type: String },
    city: { type: String },
    state: { type: String },
    reference: { type: String },
    status: { type: String, default: 'awaiting_payment' }
  },
  history: [{
    status: String,
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);