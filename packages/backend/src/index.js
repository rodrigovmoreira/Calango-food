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

// Inicializa o motor de WhatsApp passando o Socket.io
WppService.initialize(io);

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
app.post('/api/orders', orderController.createOrder);
app.post('/api/webhooks/payments', webhookController.handlePayment);

// 6. Inicialização do Servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Calango-food rodando em http://localhost:${PORT}`);
});     