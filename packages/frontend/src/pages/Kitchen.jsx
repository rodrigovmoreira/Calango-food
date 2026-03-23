import { Box, SimpleGrid, Card, Heading, Text, Badge, VStack, HStack, Flex, Stack } from '@chakra-ui/react';
import { Toaster, toaster } from "../components/ui/toaster";
import { Button } from "../components/ui/button";
import { Bike } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useState, useEffect } from 'react';
import { foodAPI } from '../services/api'; // Usando sua API configurada
import { useApp } from '../context/AppContext'; // Para pegar o tenantId

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [availableEntregadores, setAvailableEntregadores] = useState(0);
  const [loading, setLoading] = useState(true);
  const { state } = useApp(); //

  // Busca pedidos REAIS do backend filtrados pelo tenantId logado e os entregadores
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Busca pedidos e entregadores em paralelo
        const [ordersRes, driversRes] = await Promise.all([
          foodAPI.getOrders('preparing'),
          foodAPI.getDrivers()
        ]);

        setOrders(ordersRes.data);

        // Conta entregadores online e disponíveis
        const available = driversRes.data.filter(d => d.isActive !== false && d.status === 'disponivel').length;
        setAvailableEntregadores(available);

      } catch (err) {
        toaster.create({
          title: "Erro ao carregar dados",
          description: "Verifique sua conexão",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    if (state.user) fetchData();
  }, [state.user]);

  const handleDispatch = async (order) => {
    try {
      // Chama a logística integrada
      const response = await foodAPI.dispatchOrder({
        orderId: order._id,
        address: order.delivery.address
      });

      toaster.create({
        title: "Entregador Chamado!",
        description: `Motorista a caminho para o pedido #${order._id.slice(-4)}`,
        type: "success",
      });

      // Remove da tela após despachar (ou atualiza o status)
      setOrders(prev => prev.filter(o => o._id !== order._id));
    } catch (err) {
      toaster.create({
        title: "Erro ao chamar entregador",
        description: "Verifique as configurações de entrega",
        type: "error"
      });
    }
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
                  <Text fontSize="sm" color="gray.500" fontWeight="bold">Entregadores Disponíveis</Text>
                  <Heading size="md" color={availableEntregadores > 0 ? "black" : "red.500"}>
                    {availableEntregadores} {availableEntregadores === 1 ? 'motoqueiro' : 'motoqueiros'}
                  </Heading>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Stack>

        {loading ? (
          <Text>Carregando pedidos...</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {orders.map(order => (
              <Card.Root key={order._id} variant="outline" boxShadow="md">
                <Card.Header display="flex" justifyContent="space-between" flexDirection={{ base: "column", sm: "row" }} alignItems={{ base: "flex-start", sm: "center" }} gap={2}>
                  <Heading size="md">Pedido #{order._id.slice(-4)}</Heading>
                  <Badge colorPalette="orange" variant="solid">Preparando</Badge>
                </Card.Header>

                <Card.Body>
                  <VStack align="stretch" gap={3}>
                    {/* Usando Box como container para evitar erro de aninhamento de <p> */}
                    <Box pb={2} borderBottomWidth="1px">
                      <Text fontWeight="bold" fontSize="sm" color="gray.600">ENTREGAR EM:</Text>
                      <Text fontSize="md" overflowWrap="break-word" wordBreak="break-word">{order.delivery.address}</Text>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={1}>ITENS:</Text>
                      {order.items.map((item, idx) => (
                        <Text key={`${order._id}-item-${idx}`} fontSize="sm" overflowWrap="break-word" wordBreak="break-word">
                          <Box as="span" fontWeight="bold" color="brand.500">{item.quantity}x</Box> {item.name}
                        </Text>
                      ))}
                    </Box>
                  </VStack>
                </Card.Body>

                <Card.Footer>
                  <Button
                    colorPalette="brand"
                    w="full"
                    onClick={() => handleDispatch(order)}
                    disabled={!order.delivery.address || availableEntregadores === 0}
                  >
                    {availableEntregadores === 0 ? "Sem Entregadores Disponíveis" : "Chamar Entregador"}
                  </Button>
                </Card.Footer>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}

        {orders.length === 0 && !loading && (
          <VStack py={20} opacity={0.5}>
            <Text fontSize="lg">Nenhum pedido em preparo no momento.</Text>
          </VStack>
        )}

        <Toaster />
      </Box>
    </Sidebar>
  );
}