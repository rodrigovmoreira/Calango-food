import { Box, SimpleGrid, Card, Heading, Text, Badge, VStack, HStack, Flex, Stack } from '@chakra-ui/react';
import { Toaster, toaster } from "../components/ui/toaster";
import { Button } from "../components/ui/button";
import { Bike, ChefHat, Clock, Package, CheckCircle2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useState, useEffect, useCallback } from 'react';
import { foodAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const STATUS_SECTIONS = [
  { key: 'paid', label: 'Novos Pedidos', color: 'orange', icon: Clock, badgeLabel: 'Novo' },
  { key: 'preparing', label: 'Em Preparo', color: 'blue', icon: ChefHat, badgeLabel: 'Preparando' },
  { key: 'ready', label: 'Prontos para Entrega', color: 'green', icon: Package, badgeLabel: 'Pronto' },
];

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [availableEntregadores, setAvailableEntregadores] = useState(0);
  const [loading, setLoading] = useState(true);
  const { state } = useApp();

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, driversRes] = await Promise.all([
        foodAPI.getOrders(),
        foodAPI.getDrivers()
      ]);
      setOrders(ordersRes.data);
      const available = driversRes.data.filter(d => d.isActive !== false && d.status === 'disponivel').length;
      setAvailableEntregadores(available);
    } catch (err) {
      toaster.create({ title: "Erro ao carregar dados", description: "Verifique sua conexão", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state.user) fetchData();
    // Polling a cada 10s para pedidos novos
    const interval = setInterval(() => { if (state.user) fetchData(); }, 10000);
    return () => clearInterval(interval);
  }, [state.user, fetchData]);

  const getOrderStatus = (order) => {
    if (!order.history || order.history.length === 0) return 'pending';
    return order.history[order.history.length - 1].status;
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      await foodAPI.updateOrderStatus(order._id, newStatus);
      toaster.create({
        title: newStatus === 'preparing' ? "Pedido Aceito!" : "Pedido Pronto!",
        description: `Pedido #${order._id.slice(-4)} atualizado.`,
        type: "success",
      });
      fetchData();
    } catch (err) {
      toaster.create({
        title: "Erro",
        description: err.response?.data?.error || "Não foi possível atualizar o status.",
        type: "error"
      });
    }
  };

  const handleDispatch = async (order) => {
    try {
      await foodAPI.dispatchOrder({
        orderId: order._id,
        address: order.delivery.address
      });
      toaster.create({
        title: "Entregador Chamado!",
        description: `Motorista a caminho para o pedido #${order._id.slice(-4)}`,
        type: "success",
      });
      fetchData();
    } catch (err) {
      toaster.create({
        title: "Erro ao chamar entregador",
        description: err.response?.data?.message || "Verifique as configurações de entrega",
        type: "error"
      });
    }
  };

  const getTimeSince = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60}min`;
  };

  const renderOrderCard = (order, section) => {
    const status = getOrderStatus(order);
    const sectionConfig = STATUS_SECTIONS.find(s => s.key === section);

    return (
      <Card.Root key={order._id} variant="outline" boxShadow="md" overflow="hidden">
        <Box h="4px" bg={`${sectionConfig.color}.400`} />
        <Card.Header display="flex" justifyContent="space-between" flexDirection={{ base: "column", sm: "row" }} alignItems={{ base: "flex-start", sm: "center" }} gap={2} pb={2}>
          <VStack align="start" gap={0}>
            <Heading size="md">Pedido #{order._id.slice(-4)}</Heading>
            <Text fontSize="xs" color="gray.500">{order.customerName} · {getTimeSince(order.createdAt)}</Text>
          </VStack>
          <Badge colorPalette={sectionConfig.color} variant="solid">{sectionConfig.badgeLabel}</Badge>
        </Card.Header>

        <Card.Body pt={0}>
          <VStack align="stretch" gap={3}>
            <Box>
              <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wide">Itens</Text>
              {order.items.map((item, idx) => (
                <HStack key={`${order._id}-item-${idx}`} justify="space-between">
                  <Text fontSize="sm">
                    <Box as="span" fontWeight="bold" color="brand.500">{item.quantity}x</Box> {item.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">R$ {(item.price * item.quantity).toFixed(2)}</Text>
                </HStack>
              ))}
            </Box>

            <Box pb={2} borderTopWidth="1px" pt={2}>
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="sm" color="gray.600">Total</Text>
                <Text fontWeight="black" fontSize="md" color="brand.600">R$ {order.total.toFixed(2)}</Text>
              </HStack>
            </Box>

            {order.delivery?.address && (
              <Box bg="gray.50" p={2} borderRadius="md">
                <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={0.5}>ENTREGAR EM:</Text>
                <Text fontSize="sm" overflowWrap="break-word" wordBreak="break-word">{order.delivery.address}</Text>
              </Box>
            )}

            <Text fontSize="xs" color="gray.400">
              Pagamento: {order.payment?.method?.toUpperCase()} · {order.payment?.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
            </Text>
          </VStack>
        </Card.Body>

        <Card.Footer>
          {section === 'paid' && (
            <Button colorPalette="orange" w="full" onClick={() => handleStatusChange(order, 'preparing')}>
              <ChefHat size={16} style={{ marginRight: 8 }} /> Aceitar Pedido
            </Button>
          )}
          {section === 'preparing' && (
            <Button colorPalette="green" w="full" onClick={() => handleStatusChange(order, 'ready')}>
              <CheckCircle2 size={16} style={{ marginRight: 8 }} /> Pronto para Entrega!
            </Button>
          )}
          {section === 'ready' && (
            <Button
              colorPalette="brand" w="full"
              onClick={() => handleDispatch(order)}
              disabled={availableEntregadores === 0}
            >
              <Bike size={16} style={{ marginRight: 8 }} />
              {availableEntregadores === 0 ? "Sem Entregadores" : "Chamar Entregador"}
            </Button>
          )}
        </Card.Footer>
      </Card.Root>
    );
  };

  return (
    <Sidebar>
      <Box p={{ base: 4, md: 8 }}>
        <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} mb={8} gap={4}>
          <Heading size="xl" color="brand.500">Cozinha Digital</Heading>

          <Card.Root variant="elevated" size="sm" bg="white">
            <Card.Body py={2} px={4}>
              <HStack gap={3}>
                <Box p={2} bg={availableEntregadores > 0 ? "green.100" : "red.100"} borderRadius="full">
                  <Bike size={24} color={availableEntregadores > 0 ? "green" : "red"} />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" color="gray.500" fontWeight="bold">Entregadores</Text>
                  <Heading size="md" color={availableEntregadores > 0 ? "black" : "red.500"}>
                    {availableEntregadores} {availableEntregadores === 1 ? 'disponível' : 'disponíveis'}
                  </Heading>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Stack>

        {loading ? (
          <Text>Carregando pedidos...</Text>
        ) : (
          <VStack align="stretch" gap={8}>
            {STATUS_SECTIONS.map(section => {
              const sectionOrders = orders.filter(o => getOrderStatus(o) === section.key);
              return (
                <Box key={section.key}>
                  <HStack mb={4} gap={3} align="center">
                    <Box p={2} bg={`${section.color}.100`} borderRadius="lg">
                      <section.icon size={20} color={`var(--chakra-colors-${section.color}-500)`} />
                    </Box>
                    <Heading size="md" color="gray.700">{section.label}</Heading>
                    <Badge colorPalette={section.color} variant="subtle" fontSize="sm" px={3}>
                      {sectionOrders.length}
                    </Badge>
                  </HStack>

                  {sectionOrders.length === 0 ? (
                    <Text fontSize="sm" color="gray.400" pl={12}>Nenhum pedido nesta etapa.</Text>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                      {sectionOrders.map(order => renderOrderCard(order, section.key))}
                    </SimpleGrid>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}

        <Toaster />
      </Box>
    </Sidebar>
  );
}