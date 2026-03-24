import React, { useState, useEffect } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Heading, Container,
  Spinner, Center, Button
} from '@chakra-ui/react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle, FaUtensils, FaMotorcycle, FaHome,
  FaClock, FaShoppingBasket, FaMapMarkerAlt, FaCreditCard, FaBoxOpen
} from 'react-icons/fa';
import { foodAPI } from '../services/api';

const STATUS_CONFIG = {
  pending: {
    label: 'Aguardando Pagamento',
    description: 'Seu pedido está aguardando a confirmação do pagamento.',
    icon: FaClock,
    color: 'gray',
    step: 0
  },
  paid: {
    label: 'Pagamento Confirmado',
    description: 'Pagamento recebido! Seu pedido será aceito pela cozinha em instantes.',
    icon: FaCreditCard,
    color: 'orange',
    step: 1
  },
  preparing: {
    label: 'Em Preparação',
    description: 'A cozinha já está preparando seu pedido!',
    icon: FaUtensils,
    color: 'blue',
    step: 2
  },
  ready: {
    label: 'Pronto para Entrega',
    description: 'Seu pedido está pronto e aguardando o entregador.',
    icon: FaBoxOpen,
    color: 'purple',
    step: 3
  },
  delivering: {
    label: 'Saiu para Entrega',
    description: 'Seu pedido está a caminho!',
    icon: FaMotorcycle,
    color: 'teal',
    step: 4
  },
  delivered: {
    label: 'Entregue',
    description: 'Pedido entregue com sucesso! Bom apetite! 🎉',
    icon: FaHome,
    color: 'green',
    step: 5
  }
};

const TIMELINE_STEPS = [
  { key: 'paid', label: 'Pago', icon: FaCreditCard },
  { key: 'preparing', label: 'Preparando', icon: FaUtensils },
  { key: 'ready', label: 'Pronto', icon: FaBoxOpen },
  { key: 'delivering', label: 'A Caminho', icon: FaMotorcycle },
  { key: 'delivered', label: 'Entregue', icon: FaHome },
];

function StatusTimeline({ currentStatus }) {
  const currentStep = STATUS_CONFIG[currentStatus]?.step ?? 0;
  // paid=1, so timeline index 0 corresponds to step 1
  const timelineOffset = 1;

  return (
    <VStack align="stretch" gap={0} my={6}>
      {TIMELINE_STEPS.map((step, index) => {
        const stepVal = index + timelineOffset;
        const isDone = stepVal <= currentStep;
        const isCurrent = stepVal === currentStep;
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
                {isDone && !isCurrent ? <FaCheckCircle size={16} /> : <step.icon size={16} />}
              </Flex>
              {!isLast && (
                <Box
                  w="3px" h="40px"
                  bg={stepVal < currentStep ? "brand.500" : "gray.200"}
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
  const slug = location.state?.slug || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const response = await foodAPI.getOrderStatus(orderId);
      setOrder(response.data);
      setError('');
    } catch {
      setError('Não foi possível carregar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
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
          <Button colorPalette="brand" onClick={() => navigate(slug ? `/cardapio/${slug}` : '/')}>Voltar ao Início</Button>
        </VStack>
      </Center>
    );
  }

  const handleNewOrder = () => {
    if (slug) {
      navigate(`/cardapio/${slug}`);
    } else {
      navigate('/');
    }
  };

  const statusInfo = STATUS_CONFIG[order.currentStatus] || STATUS_CONFIG.pending;

  return (
    <Box minH="100vh" bg="gray.50">
      <style>
        {`
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
          @keyframes cookSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}
      </style>

      {/* Header */}
      <Box w="100%" bgGradient="to-r" gradientFrom="brand.500" gradientTo="brand.700" color="white" py={8} px={4} shadow="md" textAlign="center">
        {restaurantName && <Text fontSize="sm" opacity={0.9} mb={1}>{restaurantName}</Text>}
        <Heading size="lg" fontWeight="800">Acompanhe seu Pedido</Heading>
        <Text fontSize="xs" opacity={0.7} mt={2}>Pedido #{orderId.slice(-6).toUpperCase()}</Text>
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
          <Heading size="md" textAlign="center" color="gray.800" mb={1}>{statusInfo.label}</Heading>
          <Text textAlign="center" fontSize="sm" color="gray.500">{statusInfo.description}</Text>

          <StatusTimeline currentStatus={order.currentStatus} />
        </Box>

        {/* Detalhes */}
        <Box bg="white" p={6} borderRadius="2xl" boxShadow="0 10px 30px -10px rgba(0,0,0,0.08)">
          <Heading size="sm" color="gray.700" mb={4} display="flex" alignItems="center" gap={2}>
            <FaShoppingBasket color="var(--chakra-colors-brand-500)" /> Detalhes do Pedido
          </Heading>

          <VStack align="stretch" gap={3} mb={4}>
            {order.items.map((item, i) => (
              <Flex key={i} justify="space-between" align="center">
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.800">{item.quantity}x {item.name}</Text>
                  {item.customizations?.length > 0 && (
                    <Text fontSize="xs" color="gray.400">+ {item.customizations.map(c => c.name).join(', ')}</Text>
                  )}
                </VStack>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">R$ {(item.price * item.quantity).toFixed(2)}</Text>
              </Flex>
            ))}
          </VStack>

          <Box h="1px" bg="gray.200" my={3} />

          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold" color="gray.700">Total</Text>
            <Text fontSize="xl" fontWeight="black" color="brand.600">R$ {order.total.toFixed(2)}</Text>
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

        {/* Botão para Fazer Novo Pedido */}
        <Button 
          w="full" h="56px" mt={6} colorPalette="brand" variant="outline"
          onClick={handleNewOrder} fontWeight="bold"
        >
          Fazer um Novo Pedido
        </Button>
      </Container>
    </Box>
  );
}
