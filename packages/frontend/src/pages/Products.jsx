import { useState, useEffect } from 'react';
import { 
  Box, Heading, Table, Button, Switch, IconButton, Flex, Badge, 
  VStack, HStack, Text, Input, Textarea
} from '@chakra-ui/react';
import { Field } from '../components/ui/field';
import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogCloseTrigger } from "../components/ui/dialog";
import { Toaster, toaster } from "../components/ui/toaster";
import { Edit2, Trash2, Plus, GripVertical, UploadCloud } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { foodAPI } from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attributeGroups, setAttributeGroups] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const { data } = await foodAPI.getCategories();
      setCategories(data);
    } catch {}
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
    newGroups[groupIndex].options.push({ name: '', price: '' });
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const { data } = await foodAPI.uploadImage(formData);
      setImageUrl(data.imageUrl);
      toaster.create({ title: "Imagem carregada com sucesso", type: "success" });
    } catch (err) {
      toaster.create({ title: "Erro ao carregar imagem", description: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
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
                <VStack spacing={4} align="stretch" gap={5}>
                  <Flex gap={4}>
                    <Field label="Nome do Produto *" flex={2}>
                      <Input placeholder="Ex: Pizza Gigante (8 Pedaços)" value={name} onChange={(e) => setName(e.target.value)} bg="white"/>
                    </Field>
                    <Field label="Preço Base (A partir de) *" flex={1}>
                      <Box position="relative" w="full">
                        <Text position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.500" fontWeight="bold" fontSize="sm" zIndex={1}>R$</Text>
                        <Input type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} w="full" pl={9} bg="white" />
                      </Box>
                    </Field>
                  </Flex>

                  <Field label="Categoria *">
                    <Flex wrap="wrap" gap={2} mb={3}>
                      {categories.map(cat => (
                        <Button
                          key={cat._id}
                          size="sm"
                          variant={category === cat.name ? "solid" : "outline"}
                          colorPalette={category === cat.name ? "brand" : "gray"}
                          onClick={() => setCategory(cat.name)}
                          borderRadius="full"
                        >
                          {cat.name}
                        </Button>
                      ))}
                      {categories.length === 0 && (
                        <Text fontSize="sm" color="gray.400" fontStyle="italic">Nenhuma categoria cadastrada. Crie em "Categorias" no menu lateral.</Text>
                      )}
                    </Flex>
                    <Input placeholder="Ou digite o nome de uma categoria nova..." value={category} onChange={(e) => setCategory(e.target.value)} bg="white" />
                  </Field>

                  <Field label="Imagem do Produto (Opcional)">
                    <HStack gap={4} align="center">
                      <Box flex={1}>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          display="none"
                          id="image-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="image-upload">
                          <Button
                            as="span"
                            variant="outline"
                            w="full"
                            justifyContent="flex-start"
                            color="gray.600"
                            loading={uploading}
                          >
                            <UploadCloud size={18} style={{ marginRight: '8px' }} />
                            {uploading ? 'Enviando...' : (imageUrl ? 'Alterar Imagem' : 'Escolher Imagem')}
                          </Button>
                        </label>
                      </Box>
                      {imageUrl && (
                        <Box w="60px" h="60px" borderRadius="md" overflow="hidden" flexShrink={0} border="1px solid" borderColor="gray.200">
                          <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      )}
                    </HStack>
                  </Field>

                  <Field label="Descrição detalhada e atrativa (Opcional)">
                    <Textarea placeholder="Descreva os ingredientes ou diferenciais..." value={description} onChange={(e) => setDescription(e.target.value)} bg="white" rows={3} />
                  </Field>
                  
                  <Box mt={6} bg="gray.50" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100">
                    <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200" pb={4} mb={6}>
                      <VStack align="start" gap={0}>
                        <Heading size="md" color="gray.800">Variações & Adicionais</Heading>
                        <Text fontSize="sm" color="gray.500">Ex: Escolha o sabor, borda ou adicionais.</Text>
                      </VStack>
                      <Button size="sm" colorPalette="brand" variant="outline" onClick={addGroup}>+ Adicionar Grupo</Button>
                    </Flex>
                    
                    {attributeGroups.map((group, gIdx) => (
                      <Box key={gIdx} p={5} mb={6} borderWidth="1px" borderRadius="xl" bg="white" position="relative" shadow="sm">
                        <IconButton position="absolute" top={3} right={3} size="xs" colorPalette="red" variant="ghost" onClick={() => removeGroup(gIdx)}>
                          <Trash2 size={16} />
                        </IconButton>
                        
                        <Flex gap={4} mb={6} pr={8} align="flex-end">
                          <Field label="Nome do Grupo" flex={2}>
                            <Input placeholder="Ex: Escolha seus Sabores (Meio a Meio)" value={group.name} onChange={(e) => updateGroup(gIdx, 'name', e.target.value)} bg="gray.50"/>
                          </Field>
                          <Field label="Mínimo" flex={1}>
                            <Input type="number" placeholder="Ex: 1" value={group.minOptions} onChange={(e) => updateGroup(gIdx, 'minOptions', Number(e.target.value))} bg="gray.50"/>
                          </Field>
                          <Field label="Máximo" flex={1}>
                            <Input type="number" placeholder="Ex: 2" value={group.maxOptions} onChange={(e) => updateGroup(gIdx, 'maxOptions', Number(e.target.value))} bg="gray.50"/>
                          </Field>
                        </Flex>

                        <VStack align="stretch" gap={3} pl={6} borderLeft="3px solid" borderColor="brand.300">
                          {group.options.map((opt, oIdx) => (
                            <Flex key={oIdx} gap={4} align="flex-end" bg="gray.50" p={3} borderRadius="lg" border="1px solid" borderColor="gray.100">
                              <Flex align="center" gap={3} flex={2}>
                                <GripVertical size={16} color="#CBD5E0" />
                                <Field label={oIdx === 0 ? "Opção" : ""} w="full">
                                  <Input size="md" placeholder="Ex: Meia Calabresa" value={opt.name} onChange={(e) => updateOption(gIdx, oIdx, 'name', e.target.value)} bg="white"/>
                                </Field>
                              </Flex>
                              <Field label={oIdx === 0 ? "Preço Extra" : ""} w="160px">
                                  <Box position="relative" w="full">
                                    <Text position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.500" fontWeight="bold" fontSize="sm" zIndex={1}>R$</Text>
                                    <Input size="md" type="number" placeholder="0.00" value={opt.price} onChange={(e) => updateOption(gIdx, oIdx, 'price', e.target.value === '' ? '' : Number(e.target.value))} w="full" pl={9} bg="white" />
                                  </Box>
                              </Field>
                              <IconButton mb={oIdx === 0 ? "2px" : "0"} size="sm" colorPalette="red" variant="ghost" onClick={() => removeOption(gIdx, oIdx)}>
                                <Trash2 size={16} />
                              </IconButton>
                            </Flex>
                          ))}
                          <Button size="sm" mt={2} alignSelf="flex-start" variant="surface" colorPalette="gray" onClick={() => addOption(gIdx)}>
                            + Adicionar Opção
                          </Button>
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
