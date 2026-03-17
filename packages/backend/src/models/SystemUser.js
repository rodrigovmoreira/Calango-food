import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const systemUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'vendedor' },
  
  // Informações da Loja
  storeName: { type: String, default: 'Calango Food Delivery' },
  isOpen: { type: Boolean, default: true }, // Pausa manual emergencial
  operatingHours: {
    type: [{
      day: { type: Number, min: 0, max: 6 }, // 0=Domingo, 1=Segunda...
      openTime: { type: String, default: '18:00' },
      closeTime: { type: String, default: '23:00' },
      isActive: { type: Boolean, default: true }
    }],
    default: [
      { day: 0, openTime: '18:00', closeTime: '23:59', isActive: true },
      { day: 1, openTime: '18:00', closeTime: '23:59', isActive: false }, // Segunda folga
      { day: 2, openTime: '18:00', closeTime: '23:59', isActive: true },
      { day: 3, openTime: '18:00', closeTime: '23:59', isActive: true },
      { day: 4, openTime: '18:00', closeTime: '23:59', isActive: true },
      { day: 5, openTime: '18:00', closeTime: '23:59', isActive: true },
      { day: 6, openTime: '18:00', closeTime: '23:59', isActive: true }
    ]
  }
});

// Hash da senha antes de salvar
systemUserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Método para verificar senha no login
systemUserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  // Se userPassword for undefined, o bcrypt vai dar o erro que você viu
  if (!userPassword) return false;
  return await bcrypt.compare(candidatePassword, userPassword);
};


const SystemUser = mongoose.model('SystemUser', systemUserSchema);
export default SystemUser;