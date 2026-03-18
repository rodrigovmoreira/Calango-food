import { useState, useEffect } from 'react';
import {
  Box, Heading, Table, Button, Switch, IconButton, Flex, Badge,
  VStack, HStack, Text, Input,
} from '@chakra-ui/react';
import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogCloseTrigger } from "../components/ui/dialog";
import { Toaster, toaster } from "../components/ui/toaster";
import { Edit2, Trash2, Plus, Bike } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { foodAPI } from '../services/api';

export default function Entregadores() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data } = await foodAPI.getDrivers();
      setDrivers(data);
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao carregar entregadores.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setEditingId(driver._id);
      setName(driver.name);
      setWhatsapp(driver.whatsapp);
      setPriority(driver.priority || 0);
    } else {
      setEditingId(null);
      setName('');
      setWhatsapp('');
      setPriority(0);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !whatsapp) {
      return toaster.create({ title: "Aviso", description: "Nome e WhatsApp são obrigatórios", type: "warning" });
    }

    const payload = {
      name, whatsapp, priority: Number(priority)
    };

    try {
      if (editingId) {
        await foodAPI.updateDriver(editingId, payload);
        toaster.create({ title: "Sucesso", description: "Entregador atualizado!", type: "success" });
      } else {
        await foodAPI.createDriver(payload);
        toaster.create({ title: "Sucesso", description: "Entregador cadastrado!", type: "success" });
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao salvar entregador", type: "error" });
    }
  };

  const toggleAvailability = async (driver) => {
    try {
      await foodAPI.updateDriver(driver._id, { isActive: !driver.isActive });
      fetchDrivers();
      toaster.create({ title: "Atualizado", description: `Disponibilidade alterada para ${driver.name}`, type: "success" });
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao mudar disponibilidade", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Certeza que deseja remover este entregador?")) {
      try {
        await foodAPI.deleteDriver(id);
        fetchDrivers();
        toaster.create({ title: "Sucesso", description: "Entregador removido", type: "success" });
      } catch (err) {
        toaster.create({ title: "Erro", description: "Falha ao remover entregador", type: "error" });
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'disponivel': return <Badge colorPalette="green">Disponível</Badge>;
      case 'ocupado': return <Badge colorPalette="orange">Em Entrega</Badge>;
      case 'offline': return <Badge colorPalette="gray">Offline</Badge>;
      default: return <Badge colorPalette="gray">{status}</Badge>;
    }
  };

  return (
    <Sidebar>
      <Box p={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="xl" color="brand.500">Frota de Entregadores</Heading>

          <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)} size="md">
            <DialogTrigger asChild>
              <Button colorPalette="brand" onClick={() => handleOpenModal()}><Plus /> Novo Entregador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Entregador" : "Novo Entregador"}</DialogTitle>
                <DialogCloseTrigger />
              </DialogHeader>
              <DialogBody pb={6}>
                <VStack spacing={4} align="stretch" gap={4}>
                  <Input placeholder="Nome do Entregador *" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input placeholder="WhatsApp (ex: 5511999999999) *" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Prioridade de Chamada (Maior = Mais chance de ser chamado)</Text>
                    <Input type="number" placeholder="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value)} />
                  </Box>

                  <Button mt={8} colorPalette="brand" size="lg" onClick={handleSave}>Salvar Entregador</Button>
                </VStack>
              </DialogBody>
            </DialogContent>
          </DialogRoot>
        </Flex>

        {loading ? (
          <Text>Carregando entregadores...</Text>
        ) : (
          <Box overflowX="auto" bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
            <Table.Root variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Ativo na Loja?</Table.ColumnHeader>
                  <Table.ColumnHeader>Entregador</Table.ColumnHeader>
                  <Table.ColumnHeader>WhatsApp</Table.ColumnHeader>
                  <Table.ColumnHeader>Status Atual</Table.ColumnHeader>
                  <Table.ColumnHeader isNumeric>Entregas Hoje</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {drivers.map((driver) => (
                  <Table.Row key={driver._id} opacity={driver.isActive ? 1 : 0.6}>
                    <Table.Cell>
                      <Switch.Root
                        checked={driver.isActive !== false}
                        onChange={() => toggleAvailability(driver)}
                        colorPalette="brand"
                        size="md"
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Root>
                    </Table.Cell>
                    <Table.Cell fontWeight="bold">
                      <HStack>
                        <Bike size={16} />
                        <Text>{driver.name}</Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>{driver.whatsapp}</Table.Cell>
                    <Table.Cell>{getStatusBadge(driver.status)}</Table.Cell>
                    <Table.Cell isNumeric>
                      {driver.deliveriesToday || 0}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="flex-end" spacing={2}>
                        <IconButton size="sm" variant="ghost" colorPalette="blue" onClick={() => handleOpenModal(driver)}>
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton size="sm" variant="ghost" colorPalette="red" onClick={() => handleDelete(driver._id)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {drivers.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" py={8} color="gray.500">
                      Nenhum entregador cadastrado. Clique em "Novo Entregador" para adicionar a sua frota.
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
