import mongoose from 'mongoose';

const DeliveryDriverSchema = new mongoose.Schema({
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    index: true 
  }, 
  name: { type: String, required: true },
  whatsapp: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['disponivel', 'ocupado', 'offline'], 
    default: 'offline' 
  },
  priority: { type: Number, default: 0 } 
}, { timestamps: true });

export default mongoose.model('DeliveryDriver', DeliveryDriverSchema);