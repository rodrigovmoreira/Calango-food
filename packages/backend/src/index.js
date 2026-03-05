const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Banco de Dados - Escalabilidade Passiva com MongoDB Atlas ou Local
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/calango-food';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🐊 MongoDB conectado com sucesso!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Rota de Teste (Health Check)
app.get('/', (req, res) => {
  res.json({ 
    message: "Calango-food API Online",
    status: "Scalable & Passive Mode"
  });
});

// Exemplo de como as rotas seguirão os Patterns (Apenas para estrutura inicial)
// app.use('/api/orders', require('./routes/orderRoutes'));

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);

});