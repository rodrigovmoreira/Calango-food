import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import WppService from './services/notifications/WppService.js';
import deliveryController from './controllers/DeliveryController.js';
import orderController from './controllers/OrderController.js';
import webhookController from './controllers/WebhookController.js';
import authRoutes from './routes/authRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

// 1. Configurações de Caminho e Ambiente (Sempre primeiro)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// 2. Instanciação do App Express
const app = express();
const httpServer = createServer(app); // Cria o server HTTP
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" } // Permite o Vite
});
const PORT = process.env.PORT || 3002;

// 3. Middlewares Globais (Portões de entrada)
app.use(cors());           // Permite que o Frontend acesse a API
app.use(express.json());   // Converte o corpo das requisições para JSON
app.use('/api/auth', authRoutes);

// Inicializa o motor de WhatsApp passando o Socket.io
WppService.initialize(io);

io.on('connection', (socket) => {
  // O frontend deve enviar o tenantId na conexão
  const tenantId = socket.handshake.query.tenantId;

  if (tenantId) {
    socket.join(tenantId); // O usuário entra em uma sala exclusiva com o seu ID
    console.log(`📡 Usuário ${tenantId} conectado ao socket e isolado na sala.`);
  }

  socket.on('disconnect', () => {
    console.log('🔌 Usuário desconectado do socket.');
  });
});

// 4. Conexão com Banco de Dados
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🐊 Calango-food: MongoDB Conectado'))
  .catch(err => console.error('Erro de conexão:', err));

// 5. Definição de Rotas (Depois dos middlewares)
app.get('/', (req, res) => {
  res.json({ status: "Online", engine: "Node.js + MongoDB" });
});

// Rotas de Logística do Calango-food
app.get('/api/drivers', deliveryController.listDrivers);
app.post('/api/dispatch', deliveryController.dispatchOrder);
app.get('/api/orders', protect, orderController.getOrders);
// Nova rota pública para criar pedido a partir do cardápio
app.post('/api/orders', orderController.createOrder);

// Rotas de Produtos
import productController from './controllers/ProductController.js';
app.get('/api/products/public/:tenantId', productController.getPublicProducts);
app.get('/api/products', protect, productController.getProducts);
app.post('/api/products', protect, productController.createProduct);
app.put('/api/products/:id', protect, productController.updateProduct);
app.delete('/api/products/:id', protect, productController.deleteProduct);
// Rotas de Loja / Tenant (Público)
import * as authController from './controllers/authController.js';
app.get('/api/store/public/:tenantId', authController.getPublicProfile);

app.post('/api/webhooks/payments', webhookController.handlePayment);
// Rota para o usuário conectar o WhatsApp dele
app.post('/api/whatsapp/connect', protect, async (req, res) => {
  WppService.startSession(req.tenantId);
  res.json({ message: "Iniciando conexão..." });
});

// 6. Inicialização do Servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Calango-food rodando em http://localhost:${PORT}`);
});     