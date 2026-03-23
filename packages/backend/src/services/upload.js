import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente ANTES de qualquer acesso a process.env
// Necessário porque imports de ES Modules são hoisted e executam antes do dotenv.config() em index.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

let bucket;

try {
  // 1. Resolve o caminho a partir da raiz da pasta onde o processo está rodando (backend)
  const credentialsPath = path.resolve(process.cwd(), 'firebase-credentials.json');

  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ ERRO FIREBASE: Arquivo firebase-credentials.json não encontrado em:', credentialsPath);
  } else {
    // Inicializa o Firebase com o arquivo de credenciais local
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    } catch (parseError) {
      console.error('❌ ERRO FIREBASE: O arquivo firebase-credentials.json não contém um JSON válido:', parseError.message);
      throw parseError;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Remove prefixos gs:// caso existam no .env para evitar erro 404
        storageBucket: (process.env.FIREBASE_BUCKET_URL || 'calango-chatbot.firebasestorage.app').replace('gs://', '')
      });
    }

    bucket = admin.storage().bucket();
    console.log('✅ Firebase Storage inicializado com sucesso. Bucket:', bucket.name);
  }
} catch (error) {
  console.error('❌ ERRO FATAL ao inicializar o Firebase Admin SDK:', error.message);
}

/**
 * Faz o upload de uma imagem em memória para o Firebase Storage.
 * @param {Object} file - O arquivo do multer (req.file)
 * @param {String} tenantId - O ID do tenant logado
 * @returns {Promise<String>} - A URL pública da imagem
 */
export const uploadImage = async (file, tenantId) => {
  if (!bucket) {
    throw new Error('Firebase Storage não foi inicializado corretamente. Verifique as credenciais.');
  }

  // Sanitização do nome do arquivo (Remove acentos e espaços)
  const sanitizedOriginalName = file.originalname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.]/g, '_'); // Troca qualquer caracter especial por underscore

  const fileName = `products/${tenantId}/${Date.now()}_${sanitizedOriginalName}`;

  return new Promise((resolve, reject) => {
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error('BlobStream error:', error);
      reject(error);
    });

    blobStream.on('finish', async () => {
      try {
        // Gera uma Signed URL com validade longa (5 anos)
        const [signedUrl] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: Date.now() + 5 * 365 * 24 * 60 * 60 * 1000,
        });
        resolve(signedUrl);
      } catch (err) {
         console.error('Erro ao gerar URL assinada:', err);
         reject(err);
      }
    });

    blobStream.end(file.buffer);
  });
};