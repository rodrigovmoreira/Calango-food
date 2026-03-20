import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ tenantId: req.tenantId }).sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
};

export const getPublicCategories = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const categories = await Category.find({ tenantId }).sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });

    const category = await Category.create({ tenantId: req.tenantId, name, order: order || 0 });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Categoria já existe para este restaurante.' });
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      { name, order },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json(category);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Já existe uma categoria com esse nome.' });
    res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
};

export const reorderCategories = async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }, ...]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Formato inválido. Esperado: { items: [{id, order}] }' });
    }

    const bulkOps = items.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, tenantId: req.tenantId },
        update: { $set: { order } }
      }
    }));

    await Category.bulkWrite(bulkOps);
    res.json({ message: 'Ordem atualizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reordenar categorias.' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Category.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!result) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir categoria.' });
  }
};

export default { getCategories, getPublicCategories, createCategory, updateCategory, reorderCategories, deleteCategory };
