import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connect = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to', process.env.MONGO_URI);

    const fakeTenantId = new mongoose.Types.ObjectId();

    await mongoose.connection.db.collection('stores').insertOne({
        tenantId: fakeTenantId,
        slug: 'demo',
        name: 'Demo Store',
        description: 'Store for Demo',
        address: '123 Fake St',
        phone: '123456789',
        isOpen: true,
        logo: '',
        cover: '',
        openingHours: []
    });

    await mongoose.connection.db.collection('menuitems').insertMany([
        {
            tenantId: fakeTenantId,
            name: 'Produto Teste',
            description: 'Uma descrição legal para o produto.',
            price: 15.9,
            imageUrl: '',
            category: 'Geral',
            attributeGroups: [],
            isActive: true
        }
    ]);

    console.log('Populated demo store');
    process.exit(0);
};

connect().catch(console.error);
