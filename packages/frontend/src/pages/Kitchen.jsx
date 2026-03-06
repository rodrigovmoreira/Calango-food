import { Box, SimpleGrid, Card, Heading, Text, Badge } from '@chakra-ui/react';
import { Toaster, toaster } from "../components/ui/toaster";
import { Button } from "../components/ui/button";
import Sidebar from '../components/Sidebar';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  // Carrega pedidos em preparo
  useEffect(() => {
    // Aqui você faria o GET /api/orders?status=preparing
    // Simulando um pedido para teste:
    setOrders([{
      _id: '123',
      total: 85.50,
      delivery: { address: 'Avenida Paulista, 1578' },
      items: [{ name: 'Pizza Calabresa', quantity: 1 }]
    }]);
  }, []);

  const handleDispatch = async (order) => {
    try {
      const response = await axios.post('http://localhost:3002/api/dispatch', {
        tenantId: "SEU_TENANT_ID", // Viria do contexto do login
        address: order.delivery.address,
        restaurantAddress: "Rua do Restaurante, 100"
      });

      toaster.create({
        title: "Motoboy Chamado!",
        description: `Enviado para: ${response.data.driverName}`,
        type: "success",
      });
    } catch (_err) {
      toaster.create({ title: "Erro ao chamar motoboy", type: "error" });
    }
  };

  return (
    <Sidebar>
      <Box p={8}>
        <Heading mb={8} color="brand.500">Pedidos em Preparo</Heading>
        <SimpleGrid columns={[1, 2, 3]} spacing={6}>
        {orders.map(order => (
          <Card.Root key={order._id}>
            <Card.Header display="flex" justifyContent="space-between" flexDirection="row">
              <Heading size="sm">Pedido #{order._id.slice(-4)}</Heading>
              <Badge colorPalette="orange">Preparando</Badge>
            </Card.Header>
            <Card.Body>
              <Text fontWeight="bold">{order.delivery.address}</Text>
              {order.items.map(item => (
                <Text key={item.name}>{item.quantity}x {item.name}</Text>
              ))}
            </Card.Body>
            <Card.Footer>
              <Button variant="brand" w="full" onClick={() => handleDispatch(order)}>
                Chamar Motoboy
              </Button>
            </Card.Footer>
          </Card.Root>
        ))}
        </SimpleGrid>
        <Toaster />
      </Box>
    </Sidebar>
  );
}