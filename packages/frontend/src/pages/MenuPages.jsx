// packages/frontend/src/pages/MenuPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Flex, Heading, Text, VStack, SimpleGrid, Container, 
  Badge, Button, Image, Icon, HStack, Spinner, Center
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { FaShoppingBasket, FaClock, FaExclamationCircle } from 'react-icons/fa';
import { isStoreOpen } from '../utils/dateUtils';
import { foodAPI } from '../services/api';
import { toaster } from "../components/ui/toaster";

export default function MenuPage() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // 1. BUSCA DE DADOS REAIS DO BACKEND 
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        // Rota pública que retorna dados da loja e produtos pelo slug
        const response = await foodAPI.getPublicMenu(slug); 
        
        const { store, menuItems } = response.data;
        setRestaurant(store);
        setProducts(menuItems);
        
        // Validação de horário em tempo real [cite: 24]
        setIsOpen(isStoreOpen(store.operatingHours));
      } catch (err) {
        toaster.create({
          title: "Erro ao carregar cardápio",
          description: "Verifique o link ou sua conexão.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchMenu();
  }, [slug]);

  const addToCart = (product) => {
    if (!isOpen) {
      toaster.create({
        title: "Loja Fechada",
        description: "Não estamos aceitando pedidos no momento.",
        type: "warning",
      });
      return;
    }
    setCart(prev => [...prev, { ...product, cartId: Date.now() }]);
  };

  const totalCart = cart.reduce((acc, item) => acc + item.price, 0);

  if (loading) return (
    <Center h="100vh"><Spinner size="xl" color="brand.500" /></Center>
  );

  if (!restaurant) return (
    <Center h="100vh">
      <VStack color="gray.500">
        <Icon as={FaExclamationCircle} boxSize="50px" />
        <Text fontSize="xl">Restaurante não encontrado.</Text>
      </VStack>
    </Center>
  );

  // Agrupamento por categoria dinâmico (Universal para qualquer restaurante) 
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <Box minH="100vh" bg="gray.50" pb="120px">
      {/* HEADER DINÂMICO COM BRANDING DO TENANT  */}
      <Flex 
        h={{ base: "180px", md: "260px" }} 
        bgGradient={`linear(to-br, ${restaurant.primaryColor || '{colors.brand.700}'} 75%, {colors.brand.neon} 100%)`} 
        justify="center" 
        align="center"
        color="white"
        textAlign="center"
        px={4}
      >
        <VStack gap={3}>
          {restaurant.logoUrl && <Image src={restaurant.logoUrl} h="80px" borderRadius="full" mb={2} />}
          <Heading size="3xl" fontWeight="800" textShadow="md">{restaurant.name}</Heading>
          <HStack bg="rgba(0,0,0,0.2)" px={4} py={1} borderRadius="full">
            <Icon as={FaClock} />
            <Text fontSize="sm" fontWeight="bold">
              {isOpen ? "ABERTO" : "FECHADO"}
            </Text>
          </HStack>
        </VStack>
      </Flex>

      <Container maxW="container.md" mt="-30px">
        <VStack gap={10} align="stretch">
          {categories.map(cat => (
            <Box key={cat}>
              <Heading size="md" mb={6} color="gray.700" borderBottom="2px solid" borderColor="brand.500" pb={2} w="fit-content">
                {cat}
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {products.filter(p => p.category === cat).map(product => (
                  <Box 
                    key={product._id} 
                    p={4} 
                    bg="white" 
                    borderRadius="2xl" 
                    boxShadow="sm" 
                    border="1px solid" 
                    borderColor="gray.100"
                    _hover={{ borderColor: "brand.300", boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    <Flex justify="space-between" align="center" gap={4}>
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="bold" fontSize="lg">{product.name}</Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={2}>{product.description}</Text>
                        <Text color="brand.600" fontWeight="extrabold" fontSize="lg" mt={1}>
                          R$ {product.price.toFixed(2)}
                        </Text>
                      </VStack>
                      
                      {product.imageUrl && (
                        <Image src={product.imageUrl} boxSize="80px" objectFit="cover" borderRadius="lg" />
                      )}

                      <Button 
                        size="sm" 
                        colorPalette="brand" 
                        disabled={!isOpen || !product.isAvailable}
                        onClick={() => addToCart(product)}
                      >
                        {product.isAvailable ? 'Adicionar' : 'Esgotado'}
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      </Container>

      {/* FOOTER DA SACOLA (STICKY)  */}
      {cart.length > 0 && (
        <Box position="fixed" bottom={6} left="0" w="100%" px={4} zIndex={1000}>
          <Button 
            w="full" 
            maxW="container.md" 
            mx="auto"
            h="64px" 
            display="flex"
            colorPalette="brand" 
            boxShadow="xl"
            borderRadius="2xl"
            justifyContent="space-between"
            px={8}
            _hover={{ transform: 'scale(1.02)' }}
          >
            <HStack gap={4}>
              <Icon as={FaShoppingBasket} boxSize="24px" />
              <VStack align="start" gap={0}>
                <Text fontSize="sm" opacity={0.8}>{cart.length} {cart.length === 1 ? 'item' : 'itens'}</Text>
                <Text fontWeight="bold">Ver Sacola</Text>
              </VStack>
            </HStack>
            <Text fontSize="xl" fontWeight="black">R$ {totalCart.toFixed(2)}</Text>
          </Button>
        </Box>
      )}
    </Box>
  );
}