import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'SystemUser', required: true, index: true },
  name: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 }, // Para ordenação customizada no cardápio
}, { timestamps: true });

// Garante que dois produtos do mesmo restaurante não compartilhem a mesma categoria
categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
