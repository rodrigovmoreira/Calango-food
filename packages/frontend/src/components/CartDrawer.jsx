import React from 'react';
import { 
  Box, Flex, VStack, Text, Button, 
  Heading, IconButton, Portal
} from '@chakra-ui/react';
import { FaTimes, FaTrash, FaShoppingBasket, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  removeFromCart, 
  total, 
  slug, 
  isStoreOpen,
  restaurantName
}) {
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate(`/checkout/${slug}`, { 
      state: { cart, total, restaurantName, isStoreOpen } 
    });
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

        {/* Header */}
        <Flex 
          bgGradient="linear(to-br, brand.500, brand.neon)"
          p={6} color="white" align="center" justify="space-between"
          boxShadow="sm" flexShrink={0}
        >
          <VStack align="start" gap={0}>
            <Heading size="md" fontWeight="800">Sua Sacola</Heading>
            <Text fontSize="sm" opacity={0.9}>{restaurantName}</Text>
          </VStack>
          <IconButton 
            variant="ghost" color="white" _hover={{ bg: "whiteAlpha.300" }}
            onClick={onClose} aria-label="Fechar sacola"
          >
            <FaTimes />
          </IconButton>
        </Flex>

        {/* Body — Apenas itens */}
        <Box flex={1} overflowY="auto" p={6}>
          <VStack align="stretch" gap={3}>
            <Heading size="sm" mb={2} color="gray.700" display="flex" alignItems="center" gap={2}>
              <FaShoppingBasket color="var(--chakra-colors-brand-500)" /> Itens ({cart.length})
            </Heading>
            
            {cart.length === 0 ? (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={8}>
                Sua sacola está vazia. Adicione itens do cardápio!
              </Text>
            ) : (
              cart.map((item, index) => (
                <Flex 
                  key={item.cartId || index} 
                  justify="space-between" 
                  align="center" 
                  p={4} 
                  bg="gray.50" 
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor="gray.100"
                  _hover={{ borderColor: "gray.200", bg: "gray.100" }}
                  transition="all 0.2s"
                  gap={2}
                >
                  <VStack align="start" gap={1} flex={1} overflow="hidden">
                    <Text fontWeight="bold" fontSize="sm" color="gray.800" wordBreak="break-word" noOfLines={3}>
                      {item.name}
                    </Text>
                    {item.customizations && item.customizations.length > 0 && (
                      <Text fontSize="xs" color="gray.400" wordBreak="break-word" noOfLines={2}>
                        + {item.customizations.map(c => c.name).join(', ')}
                      </Text>
                    )}
                    <Text fontSize="sm" fontWeight="bold" color="brand.600" whiteSpace="nowrap">
                      R$ {item.price.toFixed(2)}
                    </Text>
                  </VStack>
                  <IconButton 
                    size="sm"
                    colorPalette="red" 
                    variant="ghost" 
                    onClick={() => removeFromCart(item.cartId)}
                    aria-label="Remover item"
                    flexShrink={0}
                  >
                    <FaTrash />
                  </IconButton>
                </Flex>
              ))
            )}
          </VStack>
        </Box>

        {/* Footer */}
        <Box p={6} bg="white" borderTop="1px solid" borderColor="gray.100" boxShadow="0 -4px 10px rgba(0,0,0,0.02)" flexShrink={0}>
          <Flex justify="space-between" mb={4} align="center">
            <Text color="gray.600" fontWeight="bold">Subtotal</Text>
            <Text fontSize="2xl" fontWeight="black" color="brand.600">
              R$ {total.toFixed(2)}
            </Text>
          </Flex>

          <Button 
            w="full" h="56px" colorPalette="brand" size="lg"
            fontWeight="bold" fontSize="md"
            onClick={handleCheckout}
            disabled={cart.length === 0 || !isStoreOpen}
          >
            <FaArrowRight style={{ marginRight: '8px' }} /> 
            {isStoreOpen ? "Ir para Checkout" : "Loja Fechada"}
          </Button>
        </Box>
      </Flex>
    </Portal>
  );
}
