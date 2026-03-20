import React, { useState } from 'react';
import { 
  Box, Flex, VStack, HStack, Text, Button, Input, 
  Heading, IconButton, Portal, Spinner, Icon
} from '@chakra-ui/react';
import { FaTimes, FaTrash, FaMotorcycle, FaCheckCircle, FaUser, FaWhatsapp, FaMapMarkerAlt } from 'react-icons/fa';
import { toaster } from "./ui/toaster";
import { foodAPI } from '../services/api';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  removeFromCart, 
  total, 
  tenantId, 
  isStoreOpen,
  restaurantName
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!isStoreOpen) {
      toaster.create({ title: "Loja Fechada", description: "Não estamos aceitando pedidos no momento.", type: "warning" });
      return;
    }

    if (!formData.name || !formData.phone || !formData.address) {
      toaster.create({ title: "Faltam Dados", description: "Preencha nome, WhatsApp e endereço.", type: "error" });
      return;
    }

    if (cart.length === 0) {
      toaster.create({ title: "Carrinho Vazio", description: "Adicione itens antes de finalizar.", type: "warning" });
      return;
    }

    try {
      setLoading(true);

      // Formatação dos itens para o Backend
      const itemsPayload = cart.map(item => ({
        productId: item._id,
        name: item.name,
        quantity: 1, // Considerando 1 por clique no MVP
        price: item.price,
        customizations: item.customizations || []
      }));

      const payload = {
        tenantId,
        clientId: formData.phone.replace(/\D/g, ''), // Usamos apenas os números como clientId por simplicidade
        items: itemsPayload,
        method: 'pix', // Padrão
        address: formData.address
      };

      const response = await foodAPI.createOrder(payload);

      toaster.create({
        title: "Pedido Enviado!",
        description: "Seu pedido foi recebido com sucesso.",
        type: "success",
      });

      // No mundo real, faríamos um reset do carrinho e redirecionamento para status do pedido.
      setTimeout(() => {
        window.location.reload(); // Reset para MVP
      }, 2000);

    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Erro no Pedido",
        description: err.response?.data?.error || "Ocorreu um erro ao processar seu pedido.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <Box 
        position="fixed" top={0} left={0} w="100vw" h="100vh" 
        bg="blackAlpha.600" zIndex={1300} 
        onClick={onClose}
        backdropFilter="blur(4px)"
      />
      
      {/* Drawer */}
      <Flex 
        position="fixed" top={0} right={0} w={{ base: "100%", md: "420px" }} h="100vh" 
        bg="white" zIndex={1400} direction="column"
        boxShadow="-5px 0 20px rgba(0,0,0,0.15)"
        animation="slideIn 0.3s ease-out"
      >
        <style>
          {`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}
        </style>

        {/* Header Dinâmico (Moss Green to Lavender) */}
        <Flex 
          bgGradient="linear(to-br, brand.500, brand.neon)"
          p={6} color="white" align="center" justify="space-between"
          boxShadow="sm"
        >
          <VStack align="start" gap={0}>
            <Heading size="md" fontWeight="800">Seu Pedido</Heading>
            <Text fontSize="sm" opacity={0.9}>{restaurantName}</Text>
          </VStack>
          <IconButton 
            variant="ghost" color="white" _hover={{ bg: "whiteAlpha.300" }}
            onClick={onClose} aria-label="Fechar carrinho"
          >
            <FaTimes />
          </IconButton>
        </Flex>

        {/* Body */}
        <Box flex={1} overflowY="auto" p={6}>
          <VStack align="stretch" gap={6}>
            {/* Itens do Carrinho */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                <FaShoppingBasket color="var(--chakra-colors-brand-500)" /> Itens
              </Heading>
              
              {cart.length === 0 ? (
                <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                  Sua sacola está vazia.
                </Text>
              ) : (
                <VStack align="stretch" gap={3}>
                  {cart.map((item, index) => (
                    <Flex key={item.cartId || index} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.100">
                      <VStack align="start" gap={0} flex={1}>
                        <Text fontWeight="bold" fontSize="sm" color="gray.800">{item.name}</Text>
                        <Text fontSize="xs" color="gray.500">R$ {item.price.toFixed(2)}</Text>
                      </VStack>
                      <IconButton size="xs" colorPalette="red" variant="ghost" onClick={() => removeFromCart(item.cartId)}>
                        <FaTrash />
                      </IconButton>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>

            <Box h="1px" bg="gray.200" />

            {/* Formulário do Cliente */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                <FaMapMarkerAlt color="var(--chakra-colors-brand-500)" /> Dados da Entrega
              </Heading>
              <VStack gap={4}>
                <Box w="full">
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1} display="flex" alignItems="center" gap={1}><FaUser /> Nome Completo</Text>
                  <Input 
                    placeholder="João Silva" 
                    name="name" value={formData.name} onChange={handleChange} 
                    bg="white" borderRadius="md"
                  />
                </Box>
                <Box w="full">
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1} display="flex" alignItems="center" gap={1}><FaWhatsapp /> WhatsApp</Text>
                  <Input 
                    placeholder="(11) 99999-9999" 
                    name="phone" value={formData.phone} onChange={handleChange}
                    bg="white" borderRadius="md"
                  />
                </Box>
                <Box w="full">
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1} display="flex" alignItems="center" gap={1}><FaMotorcycle /> Endereço Completo</Text>
                  <Input 
                    placeholder="Rua das Flores, 123 - Apt 45" 
                    name="address" value={formData.address} onChange={handleChange}
                    bg="white" borderRadius="md"
                  />
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Box>

        {/* Footer */}
        <Box p={6} bg="white" borderTop="1px solid" borderColor="gray.100" boxShadow="0 -4px 10px rgba(0,0,0,0.02)">
          <Flex justify="space-between" mb={4} align="center">
            <Text color="gray.600" fontWeight="bold">Total a Pagar</Text>
            <Text fontSize="2xl" fontWeight="black" color="brand.600">
              R$ {total.toFixed(2)}
            </Text>
          </Flex>

          <Button 
            w="full" h="56px" colorPalette="brand" size="lg"
            fontWeight="bold" fontSize="md"
            onClick={handleSubmit}
            disabled={loading || cart.length === 0 || !isStoreOpen}
          >
            {loading ? <Spinner size="sm" /> : (
              <>
                <FaCheckCircle style={{ marginRight: '8px' }} /> 
                {isStoreOpen ? "Finalizar Pedido" : "Loja Fechada"}
              </>
            )}
          </Button>
        </Box>
      </Flex>
    </Portal>
  );
}
