import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const systemUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'vendedor' },
  
  // Informações da Loja
  storeName: { type: String, default: 'Calango Food Delivery' },
  slug: { type: String, unique: true, sparse: true },
  isOpen: { type: Boolean, default: true }, // Pausa manual emergencial
  operatingHours: {
    type: [{
      day: { type: Number, min: 0, max: 6 }, // 0=Domingo, 1=Segunda...
      openTime: { type: String, default: '08:00' },
      closeTime: { type: String, default: '23:00' },
      isActive: { type: Boolean, default: true }
    }],
    default: [
      { day: 0, openTime: '08:00', closeTime: '23:59', isActive: true },
      { day: 1, openTime: '08:00', closeTime: '23:59', isActive: false }, // Segunda folga
      { day: 2, openTime: '08:00', closeTime: '23:59', isActive: true },
      { day: 3, openTime: '08:00', closeTime: '23:59', isActive: true },
      { day: 4, openTime: '08:00', closeTime: '23:59', isActive: true },
      { day: 5, openTime: '08:00', closeTime: '23:59', isActive: true },
      { day: 6, openTime: '08:00', closeTime: '23:59', isActive: true }
    ]
  }
});

// Hash da senha antes de salvar
systemUserSchema.pre('save', function(next) {
  // Só gera se o nome da loja mudou ou se o slug não existe
  if (this.isModified('storeName') || !this.slug) {
    this.slug = this.storeName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
      .replace(/[\s_]+/g, '-')        // Espaços para hífens
      .replace(/-+/g, '-')            // Evita hífens duplos
      .replace(/^-+|-+$/g, '');       // Limpa pontas
  }
  next();
});

// Método para verificar senha no login
systemUserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  // Se userPassword for undefined, o bcrypt vai dar o erro que você viu
  if (!userPassword) return false;
  return await bcrypt.compare(candidatePassword, userPassword);
};


const SystemUser = mongoose.model('SystemUser', systemUserSchema);
export default SystemUser;