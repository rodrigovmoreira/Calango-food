import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  clientId: { type: String, required: true }, // WhatsApp do cliente
  items: [{ 
    name: String, 
    price: Number, 
    quantity: Number 
  }],
  total: { type: Number, required: true },
  payment: {
    method: { type: String, enum: ['pix', 'card'], required: true },
    status: { type: String, default: 'pending' }, // pending, paid, failed
    transactionId: String
  },
  delivery: {
    address: { type: String, required: true },
    status: { type: String, default: 'awaiting_payment' } // awaiting_payment, preparing, dispatched, delivered
  }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);