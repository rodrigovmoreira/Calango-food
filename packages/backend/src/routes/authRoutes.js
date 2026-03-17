import express from 'express';
import * as authController from '../controllers/authController.js';
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas de Perfil/Configuração da Loja
import { protect } from '../middlewares/authMiddleware.js';
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

export default router;