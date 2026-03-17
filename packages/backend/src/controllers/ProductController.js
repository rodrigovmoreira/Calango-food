import Product from '../models/Product.js';

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
}

export default new ProductController();
