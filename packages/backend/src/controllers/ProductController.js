import Product from '../models/Product.js';
import multer from 'multer';
import { bucket } from '../config/firebase.js';

// Setup multer logic using memory storage for Firebase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('image');


class ProductController {
  // Rota pública para listar produtos do cardápio de um restaurante específico
  async getPublicProducts(req, res) {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId is required' });
      }

      // Busca apenas produtos disponíveis
      const products = await Product.find({ tenantId, isAvailable: true });
      res.json(products);
    } catch (error) {
      console.error('Error fetching public products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Criar produto (rota protegida - Lojista)
  async createProduct(req, res) {
    try {
      const tenantId = req.tenantId; // Vem do token (middleware protect)
      const data = { ...req.body, tenantId };
      const product = await Product.create(data);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obter todos os produtos do LOJISTA (protegida)
  async getProducts(req, res) {
    try {
      const tenantId = req.tenantId;
      const products = await Product.find({ tenantId });
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  }

  // Atualizar produto
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findOneAndUpdate(
        { _id: id, tenantId: req.tenantId },
        req.body,
        { new: true }
      );
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }

  // Deletar produto
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findOneAndDelete({ _id: id, tenantId: req.tenantId });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json({ message: 'Produto removido com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover produto' });
    }
  }

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
        const fileName = `products/${tenantId}/${Date.now()}_${req.file.originalname.replace(/\s/g, '_')}`;
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
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileUpload.name)}?alt=media`;

          res.status(200).json({ imageUrl });
        });

        blobStream.end(req.file.buffer);

      } catch (error) {
        console.error('Error uploading image to Firebase:', error);
        res.status(500).json({ error: 'Erro interno ao salvar imagem' });
      }
    });
  }
}

export default new ProductController();
