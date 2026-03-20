import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importando os Models
import Product from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🐊 Conectado para semear produtos...');

    const tenantId = new mongoose.Types.ObjectId('69af2e490f9cb0574cefbb36');

    // Limpando produtos antigos do tenant de teste
    await Product.deleteMany({ tenantId });

    const products = [
      {
        tenantId,
        name: "Pizza Gigante (8 Pedaços)",
        description: "Escolha até 2 sabores. A pizza perfeita para a família, massa de fermentação natural.",
        price: 0, // O preço principal vira 0 porque será governado pelos sabores Meio a Meio
        category: "Pizzas",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
        isAvailable: true,
        attributeGroups: [
          {
            name: "Escolha seus Sabores (Meio a Meio)",
            minOptions: 1,
            maxOptions: 2,
            pricingStrategy: "HIGHEST", // Cobra a metade mais cara
            options: [
              { name: "Meia Calabresa (Tradicional)", price: 45.90 },
              { name: "Meia Mussarela (Tradicional)", price: 42.90 },
              { name: "Meia Frango com Catupiry (Especial)", price: 55.90 },
              { name: "Meia Marguerita (Especial)", price: 52.90 },
              { name: "Meia Portuguesa", price: 59.90 },
            ]
          },
          {
            name: "Borda Recheada?",
            minOptions: 0,
            maxOptions: 1,
            pricingStrategy: "SUM",
            options: [
              { name: "Borda de Catupiry", price: 10.00 },
              { name: "Borda de Cheddar", price: 10.00 },
              { name: "Borda de Chocolate", price: 15.00 },
            ]
          }
        ]
      },
      {
        tenantId,
        name: "Guaraná Antarctica 2L",
        description: "O original do Brasil, sempre gelado.",
        price: 12.00,
        category: "Bebidas",
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
        isAvailable: true,
        attributeGroups: []
      },
      {
        tenantId,
        name: "Combo: 2 Pizzas Gigantes + Refri 2L",
        description: "Combo fechado para o fim de semana. Sabores predefinidos sem alterações.",
        price: 99.90,
        category: "Combos & Ofertas",
        imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
        isAvailable: true,
        attributeGroups: [
          {
            name: "Opções de Adicional",
            minOptions: 0,
            maxOptions: 10,
            pricingStrategy: "SUM",
            options: [
              { name: "Bacon Extra", price: 8.00 },
              { name: "Azeitona Extra", price: 5.00 }
            ]
          }
        ]
      }
    ];

    await Product.insertMany(products);

    console.log('✅ Produtos Semeados com sucesso!');
    console.log(`📌 Tenant atualizado: ${tenantId}`);
    
    process.exit();
  } catch (error) {
    console.error('❌ Erro no Seed de Produtos:', error);
    process.exit(1);
  }
};

runSeed();
