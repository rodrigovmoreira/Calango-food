import { useState, useEffect } from 'react';
import {
  Box, Heading, Button, Flex, Text, Input, IconButton, Badge, VStack, Spinner, HStack
} from '@chakra-ui/react';
import { Edit2, Trash2, Plus, Check, X, GripVertical } from 'lucide-react';
import { Toaster, toaster } from '../components/ui/toaster';
import { Field } from '../components/ui/field';
import Sidebar from '../components/Sidebar';
import { foodAPI } from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await foodAPI.getCategories();
      setCategories(data);
    } catch {
      toaster.create({ title: 'Erro', description: 'Falha ao carregar categorias.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setSaving(true);
      await foodAPI.createCategory({ name: newName.trim() });
      setNewName('');
      await fetchCategories();
      toaster.create({ title: 'Criada!', description: `Categoria "${newName}" adicionada.`, type: 'success' });
    } catch (err) {
      toaster.create({ title: 'Erro', description: err.response?.data?.error || 'Falha ao criar.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditingName(cat.name);
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    try {
      setSaving(true);
      await foodAPI.updateCategory(id, { name: editingName.trim() });
      setEditingId(null);
      await fetchCategories();
      toaster.create({ title: 'Atualizada!', type: 'success' });
    } catch (err) {
      toaster.create({ title: 'Erro', description: err.response?.data?.error || 'Falha ao atualizar.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Excluir a categoria "${name}"? Os produtos com essa categoria não serão excluídos, mas ficarão sem categoria.`)) return;
    try {
      await foodAPI.deleteCategory(id);
      await fetchCategories();
      toaster.create({ title: 'Excluída!', type: 'success' });
    } catch {
      toaster.create({ title: 'Erro', description: 'Falha ao excluir.', type: 'error' });
    }
  };

  return (
    <Sidebar>
      <Box p={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="xl" color="brand.500">Categorias do Cardápio</Heading>
            <Text color="gray.500" mt={1}>Organize seus produtos em seções. Arraste para reordenar.</Text>
          </Box>
          <Badge colorPalette="brand" px={3} py={1} borderRadius="full" fontSize="sm">
            {categories.length} categoria{categories.length !== 1 ? 's' : ''}
          </Badge>
        </Flex>

        {/* Formulário de criação */}
        <Box bg="white" p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" mb={8}>
          <Heading size="md" mb={4} color="gray.700">Nova Categoria</Heading>
          <Flex gap={3}>
            <Field flex={1}>
              <Input
                placeholder="Ex: Pizzas, Bebidas, Sobremesas..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                bg="gray.50"
              />
            </Field>
            <Button colorPalette="brand" onClick={handleCreate} loading={saving} disabled={!newName.trim()}>
              <Plus size={16} /> Adicionar
            </Button>
          </Flex>
        </Box>

        {/* Lista de categorias */}
        <Box bg="white" borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
          {loading ? (
            <Flex justify="center" py={12}><Spinner color="brand.500" /></Flex>
          ) : categories.length === 0 ? (
            <Box textAlign="center" py={16} color="gray.500">
              <Text fontSize="4xl" mb={3}>🏷️</Text>
              <Text fontWeight="bold">Nenhuma categoria criada ainda.</Text>
              <Text fontSize="sm">Crie sua primeira categoria acima!</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={0} divideY="1px" divideColor="gray.100">
              {categories.map((cat, idx) => (
                <Flex key={cat._id} align="center" px={6} py={4} gap={4} _hover={{ bg: 'gray.50' }} transition="bg 0.15s">
                  <GripVertical size={16} color="#CBD5E0" style={{ flexShrink: 0 }} />
                  <Badge colorPalette="brand" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs">
                    #{idx + 1}
                  </Badge>
                  
                  {editingId === cat._id ? (
                    <Flex flex={1} gap={2} align="center">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(cat._id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                        variant="outline"
                        size="sm"
                        bg="white"
                      />
                      <IconButton size="sm" colorPalette="brand" onClick={() => handleUpdate(cat._id)} loading={saving}>
                        <Check size={14} />
                      </IconButton>
                      <IconButton size="sm" variant="ghost" colorPalette="gray" onClick={() => setEditingId(null)}>
                        <X size={14} />
                      </IconButton>
                    </Flex>
                  ) : (
                    <>
                      <Text flex={1} fontWeight="semibold" color="gray.800">{cat.name}</Text>
                      <HStack gap={1}>
                        <IconButton size="sm" variant="ghost" colorPalette="blue" onClick={() => startEdit(cat)}>
                          <Edit2 size={16} />
                        </IconButton>
                        <IconButton size="sm" variant="ghost" colorPalette="red" onClick={() => handleDelete(cat._id, cat.name)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </>
                  )}
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </Box>
      <Toaster />
    </Sidebar>
  );
}
