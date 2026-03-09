import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const systemUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'vendedor' }
});

// Hash da senha antes de salvar
systemUserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Método para verificar senha no login
systemUserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


const SystemUser = mongoose.model('SystemUser', systemUserSchema);
export default SystemUser;