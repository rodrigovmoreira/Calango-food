import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { updatePaymentConfig } from '../controllers/authController.js';
import * as authController from '../controllers/authController.js';
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas de Perfil/Configuração da Loja
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.put('/payment-config', protect, updatePaymentConfig);

export default router;