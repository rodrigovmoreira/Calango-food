import fs from 'fs';

let content = fs.readFileSync('packages/backend/src/controllers/ProductController.js', 'utf8');

// Replace imports
content = content.replace(
  /import \{ bucket \} from '\.\.\/config\/firebase\.js';/,
  `import { uploadImageToFirebase } from '../services/upload.js';`
);

// Replace uploadImage function
const oldUploadMethodRegex = /\/\/ Upload product image to Firebase Storage\s+uploadImage\(req, res\) \{[\s\S]*?\}\n  \}\n/m;
const newUploadMethod = `  // Upload product image to Firebase Storage
  async uploadImage(req, res) {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Erro ao fazer upload da imagem', details: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
      }

      try {
        const tenantId = req.tenantId;
        const imageUrl = await uploadImageToFirebase(req.file, tenantId);
        res.status(200).json({ imageUrl });
      } catch (error) {
        console.error('Error uploading image to Firebase:', error);
        res.status(500).json({ error: 'Erro interno ao salvar imagem' });
      }
    });
  }
`;

content = content.replace(oldUploadMethodRegex, newUploadMethod);
fs.writeFileSync('packages/backend/src/controllers/ProductController.js', content);
console.log('Patched ProductController.js');
