import Product from '../models/Product.js';
import multer from 'multer';
import { uploadImage } from '../services/upload.js';

// Setup multer logic using memory storage for Firebase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('image');


class ProductController {
  constructor() {
    this.uploadImage = this.uploadImage.bind(this);
  }
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
        const imageUrl = await uploadImage(req.file, tenantId);
        res.status(200).json({ imageUrl });
      } catch (error) {
        console.error('Error uploading image to Firebase:', error);
        res.status(500).json({ error: 'Erro interno ao salvar imagem', details: error.message });
      }
    });
  }
}

export default new ProductController();
