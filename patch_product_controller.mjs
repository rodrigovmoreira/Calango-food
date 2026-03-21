import fs from 'fs';

let content = fs.readFileSync('packages/backend/src/controllers/ProductController.js', 'utf8');

// Insert multer setup and import bucket
const newImports = `import Product from '../models/Product.js';
import multer from 'multer';
import { bucket } from '../config/firebase.js';

// Setup multer logic using memory storage for Firebase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('image');
`;

content = content.replace("import Product from '../models/Product.js';", newImports);

// Insert uploadImage method
const newUploadMethod = `
  // Upload product image to Firebase Storage
  uploadImage(req, res) {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Erro ao fazer upload da imagem', details: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
      }

      try {
        const tenantId = req.tenantId;
        const fileName = \`products/\${tenantId}/\${Date.now()}_\${req.file.originalname.replace(/\\s/g, '_')}\`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: req.file.mimetype,
          },
        });

        blobStream.on('error', (error) => {
          console.error('BlobStream error:', error);
          res.status(500).json({ error: 'Erro no servidor ao processar imagem' });
        });

        blobStream.on('finish', async () => {
          // As URL of the file uploaded
          // It could be publicly accessible if you set bucket permissions to public,
          // or you could use a signed URL. Assuming bucket URL follows standard template if public.
          const imageUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket.name}/o/\${encodeURIComponent(fileUpload.name)}?alt=media\`;

          res.status(200).json({ imageUrl });
        });

        blobStream.end(req.file.buffer);

      } catch (error) {
        console.error('Error uploading image to Firebase:', error);
        res.status(500).json({ error: 'Erro interno ao salvar imagem' });
      }
    });
  }
`;

// Insert the new method before the end of the class
content = content.replace(/}\n\nexport default new ProductController\(\);/, `${newUploadMethod}}\n\nexport default new ProductController();`);

fs.writeFileSync('packages/backend/src/controllers/ProductController.js', content);
console.log('Patched ProductController.js');
