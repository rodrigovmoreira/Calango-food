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
import { io } from 'socket.io-client';
import { useApp } from '../context/AppContext';

const formatWhatsappMask = (value) => {
  if (!value) return '';
  let val = value.replace(/\D/g, '');
  if (val.length === 0) return '';
  
  if (val.length > 2 && val[2] !== '9') {
    val = val.slice(0, 2) + '9' + val.slice(2);
  }

  val = val.substring(0, 11);

  if (val.length <= 2) {
    return `(${val}`;
  }
  if (val.length <= 3) {
    return `(${val.slice(0, 2)}) ${val.slice(2)}`;
  }
  if (val.length <= 7) {
    return `(${val.slice(0, 2)}) ${val.slice(2, 3)} ${val.slice(3)}`;
  }
  return `(${val.slice(0, 2)}) ${val.slice(2, 3)} ${val.slice(3, 7)}-${val.slice(7, 11)}`;
};

const formatWhatsappForDisplay = (phone) => {
  if (!phone) return '';
  let val = phone.replace(/\D/g, '');
  if (val.startsWith('55')) {
    val = val.substring(2);
  }
  if (val.length === 0) return phone;
  return `+55 ${formatWhatsappMask(val)}`;
};

export default function Entregadores() {
  const { state } = useApp();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [priority, setPriority] = useState(0);
  const [status, setStatus] = useState('offline');

  useEffect(() => {
    fetchDrivers();

    // Listen for live status changes from WhatsApp bot
    const tenantId = state.user?.tenantId;
    if (tenantId) {
      const socket = io('http://localhost:3002', {
        query: { tenantId }
      });

      socket.on('driver_status_changed', (data) => {
        setDrivers(prev => prev.map(d => {
          if (d._id === data.driverId) {
            d.status = data.status;
            toaster.create({
              title: "Status Atualizado",
              description: `Entregador ${d.name} agora está ${data.status.toUpperCase()}.`,
              type: "info"
            });
          }
          return d;
        }));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [state.user]);

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
      
      let phone = driver.whatsapp || '';
      if (phone.startsWith('55')) phone = phone.substring(2);
      setWhatsapp(formatWhatsappMask(phone));
      
      setPriority(driver.priority || 0);
      setStatus(driver.status || 'offline');
    } else {
      setEditingId(null);
      setName('');
      setWhatsapp('');
      setPriority(0);
      setStatus('offline');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !whatsapp) {
      return toaster.create({ title: "Aviso", description: "Nome e WhatsApp são obrigatórios", type: "warning" });
    }

    let cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (!cleanWhatsapp.startsWith('55') && cleanWhatsapp.length > 0) {
      cleanWhatsapp = '55' + cleanWhatsapp;
    }

    const payload = {
      name, whatsapp: cleanWhatsapp, priority: Number(priority), status: status
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
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Falha ao salvar entregador";
      toaster.create({ title: "Erro", description: errorMessage, type: "error" });
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
                  <Input placeholder="WhatsApp (ex: (11) 9 9999-5555) *" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsappMask(e.target.value))} />

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Prioridade de Chamada (Maior = Mais chance de ser chamado)</Text>
                    <Input type="number" placeholder="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value)} />
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Disponibilidade (Status)</Text>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#fff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="disponivel">🟢 Disponível</option>
                      <option value="ocupado">🟠 Ocupado / Em Entrega</option>
                      <option value="offline">⚪ Offline</option>
                    </select>
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
                    <Table.Cell>{formatWhatsappForDisplay(driver.whatsapp)}</Table.Cell>
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
