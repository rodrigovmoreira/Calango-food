import { Box, SimpleGrid, Card, Heading, Text, Badge, VStack } from '@chakra-ui/react';
import { Toaster, toaster } from "../components/ui/toaster";
import { Button } from "../components/ui/button";
import Sidebar from '../components/Sidebar';
import { useState, useEffect } from 'react';
import { foodAPI } from '../services/api'; // Usando sua API configurada
import { useApp } from '../context/AppContext'; // Para pegar o tenantId

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { state } = useApp(); //

  // Busca pedidos REAIS do backend filtrados pelo tenantId logado
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Busca apenas pedidos com status 'preparing'
        const response = await foodAPI.getOrders('preparing');
        setOrders(response.data);
      } catch (err) {
        toaster.create({ 
          title: "Erro ao carregar pedidos", 
          description: err.response?.data?.message || "Verifique sua conexão",
          type: "error" 
        });
      } finally {
        setLoading(false);
      }
    };

    if (state.user) fetchOrders();
  }, [state.user]);

  const handleDispatch = async (order) => {
    try {
      // Chama a logística integrada
      const response = await foodAPI.dispatchOrder({
        orderId: order._id,
        address: order.delivery.address
      });

      toaster.create({
        title: "Motoboy Chamado!",
        description: `Motorista a caminho para o pedido #${order._id.slice(-4)}`,
        type: "success",
      });
      
      // Remove da tela após despachar (ou atualiza o status)
      setOrders(prev => prev.filter(o => o._id !== order._id));
    } catch (err) {
      toaster.create({ 
        title: "Erro ao chamar motoboy", 
        description: "Verifique as configurações de entrega",
        type: "error" 
      });
    }
  };

  return (
    <Sidebar>
      <Box p={{ base: 4, md: 8 }}>
        <Heading size="xl" mb={8} color="brand.500">Cozinha Digital</Heading>
        
        {loading ? (
          <Text>Carregando pedidos...</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {orders.map(order => (
              <Card.Root key={order._id} variant="outline" boxShadow="md">
                <Card.Header display="flex" justifyContent="space-between" flexDirection="row" alignItems="center">
                  <Heading size="md">Pedido #{order._id.slice(-4)}</Heading>
                  <Badge colorPalette="orange" variant="solid">Preparando</Badge>
                </Card.Header>
                
                <Card.Body>
                  <VStack align="stretch" gap={3}>
                    {/* Usando Box como container para evitar erro de aninhamento de <p> */}
                    <Box pb={2} borderBottomWidth="1px">
                      <Text fontWeight="bold" fontSize="sm" color="gray.600">ENTREGAR EM:</Text>
                      <Text fontSize="md">{order.delivery.address}</Text>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={1}>ITENS:</Text>
                      {order.items.map((item, idx) => (
                        <Text key={`${order._id}-item-${idx}`} fontSize="sm">
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
                    disabled={!order.delivery.address}
                  >
                    Chamar Motoboy
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