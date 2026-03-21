import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let bucket;

try {
  const credentialsPath = path.resolve(__dirname, '../../firebase-credentials.json');

  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ ERRO FIREBASE: Arquivo firebase-credentials.json não encontrado em', credentialsPath);
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
        storageBucket: process.env.FIREBASE_BUCKET_URL || 'calango-food.appspot.com'
      });
    }

    bucket = admin.storage().bucket();
    console.log('✅ Firebase Storage inicializado com sucesso.');
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

  return new Promise((resolve, reject) => {
    const fileName = `products/${tenantId}/${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
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
        // Torna o arquivo público para poder gerar uma URL direta
        await fileUpload.makePublic();

        // URL pública baseada no template padrão do Firebase Storage
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
        resolve(publicUrl);
      } catch (err) {
         console.error('Erro ao tornar arquivo público:', err);
         reject(err);
      }
    });

    blobStream.end(file.buffer);
  });
};
