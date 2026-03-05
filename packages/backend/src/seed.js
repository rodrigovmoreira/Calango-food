import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importando os Models
import DeliveryDriver from './models/DeliveryDriver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🐊 Conectado para semear dados...');

    // Limpando dados antigos para não duplicar no teste
    await DeliveryDriver.deleteMany({});

    // Criando um ID de Restaurante Fictício (Tenant)
    const fakeTenantId = new mongoose.Types.ObjectId();

    const drivers = [
      {
        tenantId: fakeTenantId,
        name: "Calango Veloz",
        whatsapp: "5511999999999",
        status: "disponivel",
        priority: 10
      },
      {
        tenantId: fakeTenantId,
        name: "Entregador 02",
        whatsapp: "5511888888888",
        status: "ocupado",
        priority: 5
      }
    ];

    await DeliveryDriver.insertMany(drivers);

    console.log('✅ Seed finalizado com sucesso!');
    console.log(`📌 ID do Restaurante para teste: ${fakeTenantId}`);
    console.log('---');
    console.log('Agora você pode usar esse ID no seu Postman/Insomnia para testar as rotas.');
    
    process.exit();
  } catch (error) {
    console.error('❌ Erro no Seed:', error);
    process.exit(1);
  }
};

runSeed();