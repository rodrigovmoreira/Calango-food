import SystemUser from '../models/SystemUser.js';
import jwt from 'jsonwebtoken';

// Função auxiliar para criar o Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret-calango', {
    expiresIn: '7d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Verifica se o usuário já existe
    const existingUser = await SystemUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }

    // 2. Cria o usuário (o password será hasheado pelo pre-save do Model)
    const newUser = await SystemUser.create({
      name,
      email,
      password,
    });

    // 3. Gera o Token e envia
    const token = signToken(newUser._id);
    res.status(201).json({
      status: 'success',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Busca o usuário forçando a vinda do password
    const user = await SystemUser.findOne({ email }).select('+password');

    // 2. Verificamos se o usuário existe e passamos a senha explicitamente
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const token = signToken(user._id);
    res.status(200).json({
      status: 'success',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};