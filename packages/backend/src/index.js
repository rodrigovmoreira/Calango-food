import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import deliveryController from './controllers/DeliveryController.js';

// 1. Configurações de Caminho e Ambiente (Sempre primeiro)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); 

// 2. Instanciação do App
const app = express();
const PORT = process.env.PORT || 3002;

// 3. Middlewares Globais (Portões de entrada)
app.use(cors());           // Permite que o Frontend acesse a API
app.use(express.json());   // Converte o corpo das requisições para JSON

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

// 6. Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});