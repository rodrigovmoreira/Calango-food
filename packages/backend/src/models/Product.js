// packages/backend/src/models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true },
  // A MÁGICA DA FLEXIBILIDADE:
  attributeGroups: [{
    name: { type: String }, // ex: "Escolha sua Borda", "Ponto da Carne"
    minOptions: { type: Number, default: 0 },
    maxOptions: { type: Number, default: 1 },
    options: [{
      name: { type: String },
      price: { type: Number, default: 0 }
    }]
  }]
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);