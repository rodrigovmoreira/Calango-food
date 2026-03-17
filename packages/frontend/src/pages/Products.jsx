import { useState, useEffect } from 'react';
import { 
  Box, Heading, Table, Button, Switch, IconButton, Flex, Badge, 
  VStack, HStack, Text, Input, Field, Textarea
} from '@chakra-ui/react';
import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogCloseTrigger } from "../components/ui/dialog";
import { Toaster, toaster } from "../components/ui/toaster";
import { Edit2, Trash2, Plus, GripVertical } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { foodAPI } from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [attributeGroups, setAttributeGroups] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await foodAPI.getProducts();
      setProducts(data);
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao carregar produtos.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product._id);
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price);
      setCategory(product.category);
      setImageUrl(product.imageUrl || '');
      setIsAvailable(product.isAvailable);
      setAttributeGroups(product.attributeGroups || []);
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImageUrl('');
      setIsAvailable(true);
      setAttributeGroups([]);
    }
    setIsModalOpen(true);
  };

  const addGroup = () => {
    setAttributeGroups([...attributeGroups, {
      name: '',
      minOptions: 0,
      maxOptions: 1,
      options: []
    }]);
  };

  const updateGroup = (index, field, value) => {
    const newGroups = [...attributeGroups];
    newGroups[index][field] = value;
    setAttributeGroups(newGroups);
  };

  const removeGroup = (index) => {
    setAttributeGroups(attributeGroups.filter((_, i) => i !== index));
  };

  const addOption = (groupIndex) => {
    const newGroups = [...attributeGroups];
    newGroups[groupIndex].options.push({ name: '', price: 0 });
    setAttributeGroups(newGroups);
  };

  const updateOption = (groupIndex, optionIndex, field, value) => {
    const newGroups = [...attributeGroups];
    newGroups[groupIndex].options[optionIndex][field] = value;
    setAttributeGroups(newGroups);
  };

  const removeOption = (groupIndex, optionIndex) => {
    const newGroups = [...attributeGroups];
    newGroups[groupIndex].options = newGroups[groupIndex].options.filter((_, i) => i !== optionIndex);
    setAttributeGroups(newGroups);
  };

  const handleSave = async () => {
    if (!name || price === '' || !category) {
      return toaster.create({ title: "Aviso", description: "Nome, preço e categoria são obrigatórios", type: "warning" });
    }

    const payload = { 
      name, description, price: Number(price), category, imageUrl, isAvailable, attributeGroups 
    };

    try {
      if (editingId) {
        await foodAPI.updateProduct(editingId, payload);
        toaster.create({ title: "Sucesso", description: "Produto atualizado!", type: "success" });
      } else {
        await foodAPI.createProduct(payload);
        toaster.create({ title: "Sucesso", description: "Produto criado!", type: "success" });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao salvar produto", type: "error" });
    }
  };

  const toggleAvailability = async (product) => {
    try {
      await foodAPI.updateProduct(product._id, { isAvailable: !product.isAvailable });
      fetchProducts();
      toaster.create({ title: "Atualizado", description: `Disponibilidade alterada para ${product.name}`, type: "success" });
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao mudar disponibilidade", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Certeza que deseja escluir este produto?")) {
      try {
        await foodAPI.deleteProduct(id);
        fetchProducts();
        toaster.create({ title: "Sucesso", description: "Produto excluído", type: "success" });
      } catch (err) {
        toaster.create({ title: "Erro", description: "Falha ao excluir produto", type: "error" });
      }
    }
  };

  return (
    <Sidebar>
      <Box p={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="xl" color="brand.500">Cardápio Inteligente</Heading>
          
          <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)} size="xl">
            <DialogTrigger asChild>
              <Button colorPalette="brand" onClick={() => handleOpenModal()}><Plus /> Novo Produto</Button>
            </DialogTrigger>
            <DialogContent h="80vh" overflowY="auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                <DialogCloseTrigger />
              </DialogHeader>
              <DialogBody pb={6}>
                <VStack spacing={4} align="stretch" gap={4}>
                  <Flex gap={4}>
                    <Input placeholder="Nome do Produto *" value={name} onChange={(e) => setName(e.target.value)} flex={2}/>
                    <Input type="number" placeholder="Preço Base *" value={price} onChange={(e) => setPrice(e.target.value)} flex={1}/>
                  </Flex>
                  <Input placeholder="Categoria * (Ex: Pizzas, Bebidas)" value={category} onChange={(e) => setCategory(e.target.value)} />
                  <Input placeholder="URL da Imagem (Opcional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                  <Textarea placeholder="Descrição atrativa (Opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                  
                  <Box mt={6}>
                    <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200" pb={2} mb={4}>
                      <Heading size="md">Variações & Adicionais</Heading>
                      <Button size="sm" variant="outline" onClick={addGroup}>+ Adicionar Grupo</Button>
                    </Flex>
                    
                    {attributeGroups.map((group, gIdx) => (
                      <Box key={gIdx} p={4} mb={4} borderWidth="1px" borderRadius="md" bg="gray.50" position="relative">
                        <IconButton position="absolute" top={2} right={2} size="xs" colorPalette="red" variant="ghost" onClick={() => removeGroup(gIdx)}>
                          <Trash2 size={16} />
                        </IconButton>
                        <Flex gap={4} mb={4} align="center">
                          <Input placeholder="Nome do Grupo (Ex: Escolha a Borda)" value={group.name} onChange={(e) => updateGroup(gIdx, 'name', e.target.value)} flex={2} bg="white"/>
                          <VStack align="start" gap={0} flex={1}>
                            <Text fontSize="xs">Mínimo</Text>
                            <Input type="number" value={group.minOptions} onChange={(e) => updateGroup(gIdx, 'minOptions', Number(e.target.value))} bg="white"/>
                          </VStack>
                          <VStack align="start" gap={0} flex={1}>
                            <Text fontSize="xs">Máximo</Text>
                            <Input type="number" value={group.maxOptions} onChange={(e) => updateGroup(gIdx, 'maxOptions', Number(e.target.value))} bg="white"/>
                          </VStack>
                        </Flex>

                        <VStack align="stretch" gap={2} pl={4} borderLeft="2px solid" borderColor="brand.200">
                          {group.options.map((opt, oIdx) => (
                            <Flex key={oIdx} gap={2} align="center">
                              <GripVertical size={16} color="gray" />
                              <Input size="sm" placeholder="Nome da Opção" value={opt.name} onChange={(e) => updateOption(gIdx, oIdx, 'name', e.target.value)} bg="white"/>
                              <Input size="sm" type="number" placeholder="Preço Extra (+R$)" value={opt.price} onChange={(e) => updateOption(gIdx, oIdx, 'price', Number(e.target.value))} bg="white" w="120px"/>
                              <IconButton size="xs" colorPalette="red" variant="ghost" onClick={() => removeOption(gIdx, oIdx)}>
                                <Trash2 size={14} />
                              </IconButton>
                            </Flex>
                          ))}
                          <Button size="xs" alignSelf="flex-start" variant="surface" onClick={() => addOption(gIdx)}>+ Adicionar Opção</Button>
                        </VStack>
                      </Box>
                    ))}
                  </Box>

                  <Button mt={8} colorPalette="brand" size="lg" onClick={handleSave}>Salvar Produto</Button>
                </VStack>
              </DialogBody>
            </DialogContent>
          </DialogRoot>
        </Flex>

        {loading ? (
          <Text>Carregando cardápio...</Text>
        ) : (
          <Box overflowX="auto" bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
            <Table.Root variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Produto</Table.ColumnHeader>
                  <Table.ColumnHeader>Categoria</Table.ColumnHeader>
                  <Table.ColumnHeader isNumeric>Preço</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {products.map((product) => (
                  <Table.Row key={product._id} opacity={product.isAvailable ? 1 : 0.6}>
                    <Table.Cell>
                      <Switch.Root 
                        checked={product.isAvailable} 
                        onChange={() => toggleAvailability(product)}
                        colorPalette="brand"
                        size="md"
                      >
                         <Switch.HiddenInput />
                         <Switch.Control>
                           <Switch.Thumb />
                         </Switch.Control>
                      </Switch.Root>
                    </Table.Cell>
                    <Table.Cell fontWeight="bold">{product.name}</Table.Cell>
                    <Table.Cell><Badge colorPalette="gray">{product.category}</Badge></Table.Cell>
                    <Table.Cell isNumeric>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="flex-end" spacing={2}>
                        <IconButton size="sm" variant="ghost" colorPalette="blue" onClick={() => handleOpenModal(product)}>
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton size="sm" variant="ghost" colorPalette="red" onClick={() => handleDelete(product._id)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {products.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={5} textAlign="center" py={8} color="gray.500">
                      Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>
      <Toaster />
    </Sidebar>
  );
}
