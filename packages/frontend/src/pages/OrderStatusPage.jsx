import React, { useState, useEffect } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Heading, Container,
  Spinner, Center, Button
} from '@chakra-ui/react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle, FaUtensils, FaMotorcycle, FaHome,
  FaClock, FaShoppingBasket, FaMapMarkerAlt
} from 'react-icons/fa';
import { foodAPI } from '../services/api';

const STATUS_CONFIG = {
  pending: {
    label: 'Pedido Recebido',
    description: 'Seu pedido foi recebido e está aguardando confirmação.',
    icon: FaClock,
    color: 'orange',
    step: 0
  },
  preparing: {
    label: 'Em Preparação',
    description: 'A cozinha já está preparando seu pedido!',
    icon: FaUtensils,
    color: 'blue',
    step: 1
  },
  delivering: {
    label: 'Saiu para Entrega',
    description: 'Seu pedido está a caminho!',
    icon: FaMotorcycle,
    color: 'purple',
    step: 2
  },
  delivered: {
    label: 'Entregue',
    description: 'Pedido entregue com sucesso! Bom apetite!',
    icon: FaHome,
    color: 'green',
    step: 3
  }
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Recebido', icon: FaCheckCircle },
  { key: 'preparing', label: 'Preparando', icon: FaUtensils },
  { key: 'delivering', label: 'A Caminho', icon: FaMotorcycle },
  { key: 'delivered', label: 'Entregue', icon: FaHome },
];

function StatusTimeline({ currentStatus }) {
  const currentStep = STATUS_CONFIG[currentStatus]?.step ?? 0;

  return (
    <VStack align="stretch" gap={0} my={6}>
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index <= currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <HStack key={step.key} gap={4} align="flex-start">
            <VStack gap={0} align="center">
              <Flex
                w="40px" h="40px" borderRadius="full"
                bg={isDone ? "brand.500" : "gray.200"}
                color={isDone ? "white" : "gray.400"}
                align="center" justify="center"
                transition="all 0.5s"
                boxShadow={isCurrent ? "0 0 0 4px rgba(72, 187, 120, 0.2)" : "none"}
                animation={isCurrent ? "pulse 2s infinite" : "none"}
              >
                <step.icon size={16} />
              </Flex>
              {!isLast && (
                <Box
                  w="3px" h="40px"
                  bg={index < currentStep ? "brand.500" : "gray.200"}
                  transition="background 0.5s"
                />
              )}
            </VStack>
            <Box pt={2} pb={isLast ? 0 : 4}>
              <Text
                fontWeight={isCurrent ? "bold" : "normal"}
                color={isDone ? "gray.800" : "gray.400"}
                fontSize="sm"
              >
                {step.label}
              </Text>
            </Box>
          </HStack>
        );
      })}
    </VStack>
  );
}

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const restaurantName = location.state?.restaurantName || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const response = await foodAPI.getOrderStatus(orderId);
      setOrder(response.data);
      setError('');
    } catch (err) {
      setError('Não foi possível carregar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Polling a cada 15s para atualizar o status
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="gray.500">Carregando pedido...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !order) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack gap={4}>
          <Text fontSize="xl" color="gray.500">{error || 'Pedido não encontrado.'}</Text>
          <Button colorPalette="brand" onClick={() => navigate('/')}>
            Voltar ao Início
          </Button>
        </VStack>
      </Center>
    );
  }

  const statusInfo = STATUS_CONFIG[order.currentStatus] || STATUS_CONFIG.pending;

  return (
    <Box minH="100vh" bg="gray.50">
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes cookSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <Box
        bgGradient="linear(to-br, brand.500, brand.neon)"
        py={8} px={4} color="white" textAlign="center"
      >
        {restaurantName && <Text fontSize="sm" opacity={0.9} mb={1}>{restaurantName}</Text>}
        <Heading size="lg" fontWeight="800">Acompanhe seu Pedido</Heading>
        <Text fontSize="xs" opacity={0.7} mt={2}>
          Pedido #{orderId.slice(-6).toUpperCase()}
        </Text>
      </Box>

      <Container maxW="container.sm" py={8} px={4}>
        {/* Status Card */}
        <Box bg="white" p={6} borderRadius="2xl" boxShadow="0 10px 30px -10px rgba(0,0,0,0.08)" mb={6}>
          <Center mb={4}>
            <Flex
              w="80px" h="80px" borderRadius="full"
              bg={`${statusInfo.color}.100`}
              color={`${statusInfo.color}.500`}
              align="center" justify="center"
              animation={order.currentStatus === 'preparing' ? 'cookSpin 3s linear infinite' : 'pulse 2s infinite'}
            >
              <statusInfo.icon size={32} />
            </Flex>
          </Center>
          <Heading size="md" textAlign="center" color="gray.800" mb={1}>
            {statusInfo.label}
          </Heading>
          <Text textAlign="center" fontSize="sm" color="gray.500">
            {statusInfo.description}
          </Text>

          {/* Timeline */}
          <StatusTimeline currentStatus={order.currentStatus} />
        </Box>

        {/* Detalhes do Pedido */}
        <Box bg="white" p={6} borderRadius="2xl" boxShadow="0 10px 30px -10px rgba(0,0,0,0.08)">
          <Heading size="sm" color="gray.700" mb={4} display="flex" alignItems="center" gap={2}>
            <FaShoppingBasket color="var(--chakra-colors-brand-500)" /> Detalhes do Pedido
          </Heading>

          <VStack align="stretch" gap={3} mb={4}>
            {order.items.map((item, i) => (
              <Flex key={i} justify="space-between" align="center">
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    {item.quantity}x {item.name}
                  </Text>
                  {item.customizations?.length > 0 && (
                    <Text fontSize="xs" color="gray.400">
                      + {item.customizations.map(c => c.name).join(', ')}
                    </Text>
                  )}
                </VStack>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </Text>
              </Flex>
            ))}
          </VStack>

          <Box h="1px" bg="gray.200" my={3} />

          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold" color="gray.700">Total</Text>
            <Text fontSize="xl" fontWeight="black" color="brand.600">
              R$ {order.total.toFixed(2)}
            </Text>
          </Flex>

          {order.delivery?.address && (
            <Box p={3} bg="gray.50" borderRadius="lg">
              <Text fontSize="xs" fontWeight="bold" color="gray.500" display="flex" alignItems="center" gap={1} mb={1}>
                <FaMapMarkerAlt /> Endereço de Entrega
              </Text>
              <Text fontSize="sm" color="gray.700">{order.delivery.address}</Text>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
