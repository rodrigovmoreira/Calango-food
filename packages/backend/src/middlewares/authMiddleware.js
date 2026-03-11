import jwt from 'jsonwebtoken';
import SystemUser from '../models/SystemUser.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Você não está logado.' });
    }

    // Verifica o token usando a chave do seu .env raiz
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca o usuário e anexa à requisição (req.user)
    const currentUser = await SystemUser.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'O usuário deste token não existe mais.' });
    }

    // Aqui está a mágica: definimos o tenantId para ser usado em todos os controllers
    req.tenantId = currentUser._id;
    req.user = currentUser;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};